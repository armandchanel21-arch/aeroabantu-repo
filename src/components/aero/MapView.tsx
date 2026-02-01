import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Contact } from '@/types/aero';
import { Search, MapPin, Users, Clock, Eye } from 'lucide-react';
import { useLocationSharing } from '@/hooks/useLocationSharing';

interface MapViewProps {
  userLocation: { lat: number; lng: number } | null;
  contacts: Contact[];
}

const MapView: React.FC<MapViewProps> = ({ 
  userLocation, 
  contacts,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  
  const { sharingState, startSharing, stopSharing, loading: sharingLoading } = useLocationSharing();
  
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [isLiveCirclesOpen, setIsLiveCirclesOpen] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [sharingDuration, setSharingDuration] = useState<number | null>(60);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current);

    const userIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-6 h-6 bg-info rounded-full border-2 border-white shadow-lg relative">
               <div class="absolute inset-0 bg-info/50 rounded-full animate-ping"></div>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    markersRef.current['user'] = L.marker([0, 0], { icon: userIcon }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (mapRef.current.getZoom() < 3) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    }
    
    markersRef.current['user'].setLatLng([userLocation.lat, userLocation.lng]);
    
    contacts.forEach(contact => {
      if (contact.lastKnownLocation) {
        const contactId = `contact-${contact.id}`;
        if (markersRef.current[contactId]) {
          markersRef.current[contactId].setLatLng([contact.lastKnownLocation.lat, contact.lastKnownLocation.lng]);
        } else {
          const contactIcon = L.divIcon({
            className: 'contact-icon',
            html: `<div class="flex flex-col-reverse items-center">
                    <div class="relative">
                      <div class="w-10 h-10 bg-primary rounded-full border-2 border-white shadow-lg overflow-hidden flex items-center justify-center text-primary-foreground text-[12px] font-bold">
                        ${contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      ${contact.isVerified ? '<div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-success border-2 border-white rounded-full animate-pulse shadow-sm"></div>' : ''}
                    </div>
                    <div class="bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-full shadow-lg text-[9px] font-black mb-1 border border-white/20 whitespace-nowrap tracking-tighter uppercase">
                      ${contact.name}
                    </div>
                  </div>`,
            iconSize: [80, 70],
            iconAnchor: [40, 60]
          });
          markersRef.current[contactId] = L.marker(
            [contact.lastKnownLocation.lat, contact.lastKnownLocation.lng], 
            { icon: contactIcon }
          ).addTo(mapRef.current!);
        }
      }
    });
  }, [userLocation, contacts]);

  const toggleContact = (id: string) => {
    setSelectedContactIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleStartSharing = async () => {
    const success = await startSharing(selectedContactIds, 'manual', sharingDuration);
    if (success) {
      setIsSharingModalOpen(false);
      setSelectedContactIds([]);
    }
  };

  const handleStopSharing = async () => {
    await stopSharing();
  };

  const focusOnContact = (contact: Contact) => {
    if (contact.lastKnownLocation && mapRef.current) {
      mapRef.current.setView([contact.lastKnownLocation.lat, contact.lastKnownLocation.lng], 17);
      setIsLiveCirclesOpen(false);
      if (window.navigator.vibrate) window.navigator.vibrate(30);
    }
  };

  const durationOptions = [
    { label: '15m', value: 15 },
    { label: '1h', value: 60 },
    { label: '8h', value: 480 },
    { label: 'Indefinite', value: null },
  ];

  const liveContacts = contacts.filter(c => c.lastKnownLocation && c.isVerified && c.id !== '1');

  return (
    <div className="h-full w-full relative overflow-hidden">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      <div className="absolute top-4 left-4 right-4 z-[1000] space-y-3">
        {/* Search */}
        <div className="bg-card/90 backdrop-blur-md rounded-2xl shadow-xl flex items-center px-4 py-3 border border-border">
          <Search className="w-5 h-5 text-muted-foreground mr-2" />
          <input 
            type="text" 
            placeholder="Search places or contacts..." 
            className="bg-transparent border-none outline-none flex-1 text-foreground text-sm placeholder:text-muted-foreground"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          {sharingState.isActive ? (
            <button 
              onClick={handleStopSharing}
              className="flex items-center gap-2 bg-emergency text-emergency-foreground px-4 py-2.5 rounded-full shadow-lg font-black text-[10px] uppercase tracking-wider animate-in fade-in slide-in-from-left"
            >
              <div className="w-2 h-2 bg-emergency-foreground rounded-full animate-pulse" />
              STOP SHARING
            </button>
          ) : (
            <button 
              onClick={() => setIsSharingModalOpen(true)}
              className="flex items-center gap-2 bg-card text-foreground px-4 py-2.5 rounded-full shadow-lg font-black text-[10px] uppercase tracking-wider border border-border"
            >
              <MapPin className="w-4 h-4 text-success" />
              SHARE LIVE LOCATION
            </button>
          )}

          <button 
            onClick={() => setIsLiveCirclesOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg font-black text-[10px] uppercase tracking-wider border transition-all ${
              liveContacts.length > 0 
              ? 'bg-info text-info-foreground border-info' 
              : 'bg-card text-foreground border-border opacity-60'
            }`}
          >
            <Users className="w-4 h-4" />
            LIVE CIRCLES {liveContacts.length > 0 && `(${liveContacts.length})`}
          </button>
        </div>
      </div>

      {/* Sharing Modal */}
      {isSharingModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setIsSharingModalOpen(false)} />
          <div className="relative w-full max-w-md bg-card rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Live Location Sharing</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Choose who can follow your journey in real-time.</p>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Duration</label>
                <div className="flex gap-2">
                  {durationOptions.map(opt => (
                    <button key={opt.label} onClick={() => setSharingDuration(opt.value)} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${sharingDuration === opt.value ? 'bg-emergency border-emergency text-emergency-foreground shadow-lg' : 'bg-secondary border-border text-muted-foreground'}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Share With</label>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {contacts.filter(c => c.isVerified).map(contact => (
                    <button key={contact.id} onClick={() => toggleContact(contact.id)} className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${selectedContactIds.includes(contact.id) ? 'bg-success/10 border-success/30' : 'bg-secondary border-border'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center font-bold text-muted-foreground border border-border">{contact.name[0]}</div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-foreground">{contact.name}</p>
                          <p className="text-[10px] text-muted-foreground">{contact.phone}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleStartSharing} disabled={selectedContactIds.length === 0 || sharingLoading} className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all disabled:opacity-50">
                {sharingLoading ? 'STARTING...' : 'START LIVE SHARING'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Circles Modal */}
      {isLiveCirclesOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setIsLiveCirclesOpen(false)} />
          <div className="relative w-full max-w-md bg-card rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Active Live Circles</h3>
              <div className="flex items-center gap-1 bg-info/10 px-2 py-1 rounded-lg">
                <div className="w-1.5 h-1.5 bg-info rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-info uppercase">Live Now</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">These contacts are currently sharing their live location with you.</p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {liveContacts.length > 0 ? (
                liveContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => focusOnContact(contact)}
                    className="w-full flex items-center justify-between p-4 bg-secondary border border-border rounded-2xl transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center font-bold text-muted-foreground text-lg border border-border shadow-sm">
                          {contact.name[0]}
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-success border-2 border-card rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-success-foreground rounded-full animate-ping" />
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-foreground uppercase tracking-tight">{contact.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Active Now</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-card p-2 rounded-xl shadow-sm border border-border">
                      <Eye className="w-5 h-5 text-info" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <MapPin className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No Active Shares from Circle</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsLiveCirclesOpen(false)}
              className="w-full mt-6 bg-secondary text-muted-foreground py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
