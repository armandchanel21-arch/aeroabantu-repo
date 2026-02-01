import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/aero';
import { useAuth } from './useAuth';

export const useContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch contacts from database
  const fetchContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedContacts: Contact[] = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        isEmergency: c.is_emergency,
        isVerified: c.is_verified,
      }));

      setContacts(mappedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = async (contact: Omit<Contact, 'id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          name: contact.name,
          phone: contact.phone || null,
          email: contact.email || null,
          is_emergency: contact.isEmergency || false,
          is_verified: contact.isVerified || false,
        })
        .select()
        .single();

      if (error) throw error;

      const newContact: Contact = {
        id: data.id,
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        isEmergency: data.is_emergency,
        isVerified: data.is_verified,
      };

      setContacts(prev => [...prev, newContact]);
      return newContact;
    } catch (error) {
      console.error('Error adding contact:', error);
      return null;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    if (!user) return false;

    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
      if (updates.email !== undefined) dbUpdates.email = updates.email || null;
      if (updates.isEmergency !== undefined) dbUpdates.is_emergency = updates.isEmergency;
      if (updates.isVerified !== undefined) dbUpdates.is_verified = updates.isVerified;

      const { error } = await supabase
        .from('contacts')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ));
      return true;
    } catch (error) {
      console.error('Error updating contact:', error);
      return false;
    }
  };

  const deleteContact = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      return false;
    }
  };

  return {
    contacts,
    loading,
    addContact,
    updateContact,
    deleteContact,
    refetch: fetchContacts,
  };
};
