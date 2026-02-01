import React, { useState } from 'react';
import { Contact } from '@/types/aero';
import { UserPlus, Trash2, RefreshCw, Shield, ShieldCheck, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ContactsListProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

interface VerificationEmail {
  id: string;
  contactId: string;
  recipientName: string;
  recipientEmail: string;
  url: string;
  sentAt: number;
}

const ContactsList: React.FC<ContactsListProps> = ({ contacts, setContacts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [sentEmails, setSentEmails] = useState<VerificationEmail[]>([]);

  const generateVerificationEmail = (contact: Contact) => {
    const token = Math.random().toString(36).substr(2, 12).toUpperCase();
    const newMail: VerificationEmail = {
      id: Math.random().toString(36).substr(2, 9),
      contactId: contact.id,
      recipientName: contact.name,
      recipientEmail: contact.email,
      url: `https://aeroabantu.com/verify?token=${token}`,
      sentAt: Date.now()
    };
    setSentEmails(prev => [newMail, ...prev].slice(0, 5));
  };

  const addContact = () => {
    if (!newName || !newPhone || !newEmail) return;
    const newContact: Contact = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      phone: newPhone,
      email: newEmail,
      isEmergency: true,
      isVerified: false
    };
    
    setContacts([...contacts, newContact]);
    generateVerificationEmail(newContact);
    
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setIsAdding(false);
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
    setSentEmails(prev => prev.filter(email => email.contactId !== id));
  };

  const simulateResend = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    
    setVerifyingId(id);
    setTimeout(() => {
      setVerifyingId(null);
      generateVerificationEmail(contact);
      if (window.navigator.vibrate) window.navigator.vibrate(20);
    }, 1000);
  };

  const handleLinkClick = async (email: VerificationEmail) => {
    setContacts(prev => prev.map(c => 
      c.id === email.contactId ? { ...c, isVerified: true } : c
    ));
    setSentEmails(prev => prev.filter(e => e.id !== email.id));
    if (window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Emergency Contacts</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-emergency text-emergency-foreground px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          ADD
        </button>
      </div>

      {/* Add Contact Form */}
      {isAdding && (
        <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-foreground uppercase text-sm tracking-wider">New Contact</h3>
            <button onClick={() => setIsAdding(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            <input 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Full Name" 
              className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emergency outline-none text-foreground placeholder:text-muted-foreground"
            />
            <input 
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder="Phone Number" 
              type="tel"
              className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emergency outline-none text-foreground placeholder:text-muted-foreground"
            />
            <input 
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Email Address" 
              type="email"
              className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emergency outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button 
            onClick={addContact}
            disabled={!newName || !newPhone || !newEmail}
            className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-black shadow-lg disabled:opacity-50"
          >
            ADD & SEND VERIFICATION
          </button>
        </div>
      )}

      {/* Contact List */}
      <div className="space-y-3">
        {contacts.map(contact => (
          <div key={contact.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-black text-lg shadow-md">
              {contact.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground truncate">{contact.name}</p>
                {contact.isVerified ? (
                  <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{contact.phone}</p>
              <p className="text-[10px] text-muted-foreground truncate">{contact.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {!contact.isVerified && contact.id !== '1' && (
                <button 
                  onClick={() => simulateResend(contact.id)}
                  disabled={verifyingId === contact.id}
                  className="p-2 text-muted-foreground hover:text-info transition-colors disabled:animate-spin"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
              {contact.id !== '1' && (
                <button 
                  onClick={() => removeContact(contact.id)}
                  className="p-2 text-muted-foreground hover:text-emergency transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pending Verifications */}
      {sentEmails.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-500">
          <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Pending Verifications (Tap to Simulate)</h4>
          <div className="space-y-2">
            {sentEmails.map(email => (
              <button
                key={email.id}
                onClick={() => handleLinkClick(email)}
                className="w-full text-left bg-info/10 border border-info/20 rounded-2xl p-4 transition-all active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">Email sent to {email.recipientName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{email.recipientEmail}</p>
                    <p className="text-[9px] text-info mt-1 font-mono truncate">{email.url}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-success shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-secondary border border-border rounded-2xl">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            Verified contacts will receive your live location and emergency alerts. All contacts must accept your invitation to complete verification.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsList;
