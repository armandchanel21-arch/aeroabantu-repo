import React, { useState, useEffect } from 'react';
import { User } from '@/types/aero';
import { Mail, Phone, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileProps {
  user: User | null;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editName,
          phone: editPhone,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">My Profile</h2>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-emergency font-bold text-sm"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-black shadow-xl">
            {user.name?.[0] || 'U'}
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground">{user.name || 'User'}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Verified Responder</p>
          </div>
        </div>

        <div className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground px-1">Display Name</label>
                <input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emergency outline-none text-foreground transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground px-1">Mobile Number</label>
                <input 
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emergency outline-none text-foreground transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-emergency text-emergency-foreground font-bold py-3 rounded-2xl shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-secondary text-muted-foreground font-bold py-3 rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-secondary rounded-2xl border border-border">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Email</p>
                  <p className="text-sm font-bold text-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-secondary rounded-2xl border border-border">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Phone</p>
                  <p className="text-sm font-bold text-foreground">{user.phone || 'Not set'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-emergency/10 border border-emergency/20 rounded-2xl p-4">
          <p className="text-[10px] text-emergency font-bold leading-relaxed">
            Your credentials are used to identify you during emergency alerts. Keep your information up-to-date for faster responder identification.
          </p>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-4 text-muted-foreground hover:text-emergency font-bold transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out of AeroAbantu
        </button>
      </div>
    </div>
  );
};

export default Profile;
