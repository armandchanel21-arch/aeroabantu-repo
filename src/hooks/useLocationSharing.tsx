import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type TriggerSource = 'manual' | 'sos' | 'voice';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface LiveLocationSession {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  isActive: boolean;
  triggeredBy: TriggerSource;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocationSharingState {
  isActive: boolean;
  sessionId: string | null;
  sharedWithContactIds: string[];
  shareTokens: string[];
  triggeredBy: TriggerSource | null;
  expiresAt: number | null;
}

export const useLocationSharing = () => {
  const { user } = useAuth();
  const [sharingState, setSharingState] = useState<LocationSharingState>({
    isActive: false,
    sessionId: null,
    sharedWithContactIds: [],
    shareTokens: [],
    triggeredBy: null,
    expiresAt: null,
  });
  const [loading, setLoading] = useState(false);
  const locationWatchId = useRef<number | null>(null);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentLocationRef = useRef<{ lat: number; lng: number; accuracy?: number } | null>(null);

  // Check for active session on mount
  useEffect(() => {
    if (!user) return;
    
    const checkActiveSession = async () => {
      const { data, error } = await supabase
        .from('live_locations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          await stopSharing();
          return;
        }

        // Resume active session
        const { data: shares } = await supabase
          .from('location_shares')
          .select('recipient_contact_id, share_token')
          .eq('live_location_id', data.id);

        setSharingState({
          isActive: true,
          sessionId: data.id,
          sharedWithContactIds: shares?.map(s => s.recipient_contact_id) || [],
          shareTokens: shares?.map(s => s.share_token).filter(Boolean) as string[] || [],
          triggeredBy: data.triggered_by as TriggerSource,
          expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : null,
        });

        startLocationUpdates(data.id);
      }
    };

    checkActiveSession();
  }, [user]);

  // Check for expiration
  useEffect(() => {
    if (!sharingState.isActive || !sharingState.expiresAt) return;

    const interval = setInterval(() => {
      if (Date.now() > sharingState.expiresAt!) {
        stopSharing();
        toast.info('Location sharing expired');
        if (window.navigator.vibrate) window.navigator.vibrate(200);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sharingState.isActive, sharingState.expiresAt]);

  const startLocationUpdates = useCallback((sessionId: string) => {
    // Watch position
    if (navigator.geolocation) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          currentLocationRef.current = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
        },
        (err) => console.error('Location error:', err),
        { enableHighAccuracy: true }
      );
    }

    // Update database every 10 seconds
    updateIntervalRef.current = setInterval(async () => {
      if (!currentLocationRef.current) return;

      await supabase
        .from('live_locations')
        .update({
          latitude: currentLocationRef.current.lat,
          longitude: currentLocationRef.current.lng,
          accuracy: currentLocationRef.current.accuracy,
        })
        .eq('id', sessionId);
    }, 10000);
  }, []);

  const stopLocationUpdates = useCallback(() => {
    if (locationWatchId.current !== null) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  const startSharing = useCallback(async (
    contactIds: string[],
    triggeredBy: TriggerSource = 'manual',
    durationMinutes: number | null = null,
    contactsData?: Contact[]
  ) => {
    if (!user) {
      toast.error('Please sign in to share your location');
      return false;
    }

    if (contactIds.length === 0) {
      toast.error('Please select at least one contact');
      return false;
    }

    setLoading(true);

    try {
      // Get current position first
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });

      const expiresAt = durationMinutes 
        ? new Date(Date.now() + durationMinutes * 60000).toISOString() 
        : null;

      // Create live location session
      const { data: session, error: sessionError } = await supabase
        .from('live_locations')
        .insert({
          user_id: user.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          triggered_by: triggeredBy,
          expires_at: expiresAt,
          is_active: true,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create share records for each contact
      const shareRecords = contactIds.map(contactId => ({
        live_location_id: session.id,
        sharer_user_id: user.id,
        recipient_contact_id: contactId,
      }));

      const { data: insertedShares, error: sharesError } = await supabase
        .from('location_shares')
        .insert(shareRecords)
        .select('share_token');

      if (sharesError) throw sharesError;

      const tokens = insertedShares?.map(s => s.share_token).filter(Boolean) as string[] || [];

      setSharingState({
        isActive: true,
        sessionId: session.id,
        sharedWithContactIds: contactIds,
        shareTokens: tokens,
        triggeredBy,
        expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
      });

      startLocationUpdates(session.id);

      // Send notifications to contacts
      if (contactsData && contactsData.length > 0 && tokens.length > 0) {
        try {
          const notificationPayload = {
            contacts: contactsData.map(c => ({
              name: c.name,
              email: c.email,
              phone: c.phone,
            })),
            shareTokens: tokens,
            sharerName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone',
            triggeredBy,
          };

          const { error: notifError } = await supabase.functions.invoke('send-sos-notification', {
            body: notificationPayload,
          });

          if (notifError) {
            console.error('Failed to send notifications:', notifError);
            toast.warning('Location shared but notifications may not have been sent');
          } else {
            const notifType = triggeredBy === 'sos' ? 'SOS alerts' : 'notifications';
            toast.success(`${notifType} sent to ${contactsData.length} contact(s)`);
          }
        } catch (notifError) {
          console.error('Notification error:', notifError);
        }
      }

      const triggerLabel = triggeredBy === 'sos' ? 'SOS Alert' : triggeredBy === 'voice' ? 'Voice Command' : 'Live Location';
      toast.success(`${triggerLabel} sharing started with ${contactIds.length} contact(s)`);

      if (window.navigator.vibrate) window.navigator.vibrate(50);

      return true;
    } catch (error) {
      console.error('Error starting location sharing:', error);
      toast.error('Failed to start location sharing');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, startLocationUpdates]);

  const stopSharing = useCallback(async () => {
    if (!sharingState.sessionId) return;

    setLoading(true);

    try {
      await supabase
        .from('live_locations')
        .update({ is_active: false })
        .eq('id', sharingState.sessionId);

      stopLocationUpdates();

      setSharingState({
        isActive: false,
        sessionId: null,
        sharedWithContactIds: [],
        shareTokens: [],
        triggeredBy: null,
        expiresAt: null,
      });

      toast.info('Location sharing stopped');
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    } catch (error) {
      console.error('Error stopping location sharing:', error);
      toast.error('Failed to stop sharing');
    } finally {
      setLoading(false);
    }
  }, [sharingState.sessionId, stopLocationUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationUpdates();
    };
  }, [stopLocationUpdates]);

  return {
    sharingState,
    loading,
    startSharing,
    stopSharing,
  };
};
