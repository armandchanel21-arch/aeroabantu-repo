import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from '@/integrations/supabase/client';
import AeroIcon from '@/components/aero/AeroIcon';
import { AlertTriangle, MapPin, Clock, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface SharedLocationData {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  is_active: boolean;
  triggered_by: string;
  expires_at: string | null;
  updated_at: string;
  sharer_name?: string;
}

// Component to recenter map when location updates
const MapRecenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const TrackLocation = () => {
  const { token } = useParams<{ token: string }>();
  const [location, setLocation] = useState<SharedLocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid tracking link');
      setLoading(false);
      return;
    }

    const fetchLocation = async () => {
      try {
        // Get share info by token
        const { data: share, error: shareError } = await supabase
          .from('location_shares')
          .select('live_location_id, recipient_contact_id')
          .eq('share_token', token)
          .single();

        if (shareError || !share) {
          setError('Tracking link not found or expired');
          setLoading(false);
          return;
        }

        // Get the live location
        const { data: liveLocation, error: locError } = await supabase
          .from('live_locations')
          .select('*')
          .eq('id', share.live_location_id)
          .single();

        if (locError || !liveLocation) {
          setError('Location data not available');
          setLoading(false);
          return;
        }

        if (!liveLocation.is_active) {
          setError('Location sharing has ended');
          setLoading(false);
          return;
        }

        // Check if expired
        if (liveLocation.expires_at && new Date(liveLocation.expires_at) < new Date()) {
          setError('Location sharing has expired');
          setLoading(false);
          return;
        }

        setLocation(liveLocation);
        setLastUpdate(new Date(liveLocation.updated_at));
        setLoading(false);

        // Subscribe to realtime updates
        const channel = supabase
          .channel(`live_location_${liveLocation.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'live_locations',
              filter: `id=eq.${liveLocation.id}`,
            },
            (payload) => {
              const updated = payload.new as SharedLocationData;
              if (!updated.is_active) {
                setError('Location sharing has ended');
                setLocation(null);
              } else {
                setLocation(updated);
                setLastUpdate(new Date(updated.updated_at));
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error('Error fetching location:', err);
        setError('Failed to load location data');
        setLoading(false);
      }
    };

    fetchLocation();
  }, [token]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getAlertType = (triggeredBy: string) => {
    switch (triggeredBy) {
      case 'sos':
        return { label: 'SOS ALERT', color: 'bg-emergency text-emergency-foreground' };
      case 'voice':
        return { label: 'VOICE ALERT', color: 'bg-warning text-warning-foreground' };
      default:
        return { label: 'LIVE LOCATION', color: 'bg-success text-success-foreground' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-primary p-4 rounded-2xl">
            <AeroIcon className="w-12 h-12 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">Loading location...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="bg-muted p-4 rounded-2xl">
            <AlertTriangle className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Unable to Track</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex items-center gap-2 mt-4">
            <div className="bg-primary p-1.5 rounded-xl">
              <AeroIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-black text-foreground tracking-[0.1em] uppercase">
              AERO<span className="text-emergency">ABANTU</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!location) return null;

  const alertType = getAlertType(location.triggered_by);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card px-4 py-3 shadow-sm z-10 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-1.5 rounded-xl shadow-md">
              <AeroIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-base font-black text-foreground tracking-[0.1em] uppercase">
              AERO<span className="text-emergency">ABANTU</span>
            </h1>
          </div>
          <div className={`px-3 py-1.5 rounded-full ${alertType.color} shadow-sm`}>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {alertType.label}
            </span>
          </div>
        </div>
      </header>

      {/* Status bar */}
      <div className="bg-card/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-xs font-medium text-foreground">Live Tracking Active</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          <span className="text-[10px] font-medium">
            Updated {lastUpdate ? formatTimeAgo(lastUpdate) : 'N/A'}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[location.latitude, location.longitude]}
          zoom={16}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[location.latitude, location.longitude]}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">
                  {location.triggered_by === 'sos' ? '🆘 Emergency Location' : '📍 Live Location'}
                </p>
                {location.accuracy && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Accuracy: ±{Math.round(location.accuracy)}m
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
          <MapRecenter lat={location.latitude} lng={location.longitude} />
        </MapContainer>

        {/* Location info overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-border">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${location.triggered_by === 'sos' ? 'bg-emergency/10' : 'bg-success/10'}`}>
                <MapPin className={`w-5 h-5 ${location.triggered_by === 'sos' ? 'text-emergency' : 'text-success'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {location.triggered_by === 'sos' ? 'Emergency SOS' : 'Location Share'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
                {location.expires_at && (
                  <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px]">
                      Expires: {new Date(location.expires_at).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackLocation;
