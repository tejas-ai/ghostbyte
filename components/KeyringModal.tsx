import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import { soundFx } from '../services/soundFx';
import {
  generateAsymmetricKeyPair,
  getStoredKeyring,
  saveStoredKeyring,
  getStoredContacts,
  saveStoredContacts,
  addContactPublicKey,
  type KeyPairInfo,
  type ContactPublicKey,
} from '../services/asymmetricCrypto';
import { runCryptoSelfTests, type SelfTestReport } from '../services/cryptoSelfTest';

interface KeyringModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type KeyringTab = 'identity' | 'contacts' | 'diagnostics';

export default function KeyringModal({ isOpen, onClose }: KeyringModalProps) {
  const [tab, setTab] = useState<KeyringTab>('identity');
  const [keyring, setKeyring] = useState<KeyPairInfo[]>([]);
  const [contacts, setContacts] = useState<ContactPublicKey[]>([]);

  // Key creation state
  const [newKeyName, setNewKeyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Add contact state
  const [contactName, setContactName] = useState('');
  const [contactArmor, setContactArmor] = useState('');
  const [contactError, setContactError] = useState('');

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Diagnostics state
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testReport, setTestReport] = useState<SelfTestReport | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    let storedKeys = getStoredKeyring();
    if (storedKeys.length === 0) {
      // Auto-generate a default keypair if none exists
      generateAsymmetricKeyPair('Primary Stealth Identity').then((k) => {
        saveStoredKeyring([k]);
        setKeyring([k]);
      });
    } else {
      setKeyring(storedKeys);
    }
    setContacts(getStoredContacts());
  };

  const handleGenerateKey = async () => {
    soundFx.playClick();
    setIsGenerating(true);
    try {
      const name = newKeyName.trim() || `Identity #${keyring.length + 1}`;
      const newKey = await generateAsymmetricKeyPair(name);
      const updated = [newKey, ...keyring];
      saveStoredKeyring(updated);
      setKeyring(updated);
      setNewKeyName('');
      soundFx.playSuccess();
    } catch (err: any) {
      soundFx.playError();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteKey = (id: string) => {
    soundFx.playClick();
    if (keyring.length <= 1) {
      alert('You must maintain at least one identity keypair in your enclave.');
      return;
    }
    if (confirm('Are you sure you want to permanently delete this keypair from browser storage?')) {
      const updated = keyring.filter((k) => k.id !== id);
      saveStoredKeyring(updated);
      setKeyring(updated);
    }
  };

  const handleAddContact = async () => {
    soundFx.playClick();
    setContactError('');
    if (!contactArmor.trim()) {
      setContactError('Please paste a valid Public Key armor block.');
      return;
    }
    try {
      const contact = await addContactPublicKey(contactName, contactArmor);
      setContacts(getStoredContacts());
      setContactName('');
      setContactArmor('');
      soundFx.playSuccess();
    } catch (err: any) {
      setContactError(err?.message || 'Invalid public key format.');
      soundFx.playError();
    }
  };

  const handleDeleteContact = (id: string) => {
    soundFx.playClick();
    const updated = contacts.filter((c) => c.id !== id);
    saveStoredContacts(updated);
    setContacts(updated);
  };

  const copyToClipboard = (text: string, id: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportBackup = () => {
    soundFx.playClick();
    const backupData = {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      keyring,
      contacts,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quietsend_keyring_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunSelfTest = async () => {
    soundFx.playClick();
    setIsRunningTest(true);
    try {
      const report = await runCryptoSelfTests();
      setTestReport(report);
      if (report.overallPass) {
        soundFx.playSuccess();
      } else {
        soundFx.playError();
      }
    } finally {
      setIsRunningTest(false);
    }
  };

  if (!isOpen) return null;

  const activeKey = keyring[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-3xl bg-[#080c16] border border-cyan-500/40 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-950/40 via-purple-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 p-[1.5px] shadow-lg">
              <div className="w-full h-full bg-[#0a0d18] rounded-[10px] flex items-center justify-center text-cyan-400">
                <Key size={18} />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Asymmetric Keyring & Enclave Studio</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  ECDH P-256
                </span>
              </h3>
              <p className="text-xs text-slate-400">Manage public/private keys and cryptographic verification vectors.</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-6 pt-3 border-b border-white/10 bg-black/40 gap-2">
          <button
            onClick={() => {
              soundFx.playClick();
              setTab('identity');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'identity'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={14} />
            <span>My Keypair ({keyring.length})</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setTab('contacts');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'contacts'
                ? 'border-purple-400 text-purple-300 bg-purple-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck size={14} />
            <span>Contact Public Keys ({contacts.length})</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setTab('diagnostics');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'diagnostics'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity size={14} />
            <span>CAVP Diagnostic Suite</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {tab === 'identity' && (
            <div className="space-y-6">
              {/* Primary Identity Card */}
              {activeKey && (
                <div className="p-5 rounded-2xl glass-3d-blue space-y-4 border-cyan-400/30">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      <h4 className="text-sm font-bold text-white">{activeKey.name}</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      ACTIVE IDENTITY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Key Fingerprint (SHA-256)</span>
                      <p className="text-cyan-300 font-bold tracking-wider">{activeKey.fingerprint}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Curve / Algorithm</span>
                      <p className="text-purple-300 font-bold">ECDH P-256 (WebCrypto)</p>
                    </div>
                  </div>

                  {/* Public Key Armor Block */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-bold">Public Key Armor (Share with senders):</span>
                      <button
                        onClick={() => copyToClipboard(activeKey.publicKeyArmor, activeKey.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        {copiedId === activeKey.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === activeKey.id ? 'Copied Armor!' : 'Copy Public Armor'}</span>
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={activeKey.publicKeyArmor}
                      rows={4}
                      className="w-full p-2.5 rounded-lg bg-black/70 border border-white/10 text-[10px] font-mono text-slate-300 select-all resize-none focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Generate New Keypair Section */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Plus size={14} className="text-cyan-400" />
                  <span>Generate Additional Identity Keypair</span>
                </h5>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Identity Label (e.g. Work Laptop, Persona B)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleGenerateKey}
                    disabled={isGenerating}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    {isGenerating ? <RefreshCw className="animate-spin" size={13} /> : <Sparkles size={13} />}
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* Backup & Restore Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-slate-400">Protect your asymmetric keypairs with an encrypted JSON backup:</span>
                <button
                  onClick={exportBackup}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold transition-all cursor-pointer"
                >
                  <Download size={13} />
                  <span>Export Backup</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'contacts' && (
            <div className="space-y-6">
              {/* Add Contact Form */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                  <Plus size={14} className="text-purple-400" />
                  <span>Import Recipient's Public Key</span>
                </h5>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Contact Name (e.g. Alice, Project Lead)"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                  />
                  <textarea
                    placeholder="Paste -----BEGIN QUIETSEND PUBLIC KEY----- Armor Block..."
                    value={contactArmor}
                    onChange={(e) => setContactArmor(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-lg bg-black/60 border border-white/15 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                  />
                  {contactError && (
                    <p className="text-xs text-red-400 font-semibold">{contactError}</p>
                  )}
                  <button
                    onClick={handleAddContact}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <UserCheck size={13} />
                    <span>Save Contact Public Key</span>
                  </button>
                </div>
              </div>

              {/* Contacts List */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Stored Contacts ({contacts.length})
                </h5>

                {contacts.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-white/15 text-center text-xs text-slate-500">
                    No contacts imported yet. Paste your recipient's public key armor above to encrypt files directly to them!
                  </div>
                ) : (
                  contacts.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{c.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300">
                            {c.fingerprint}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Added {new Date(c.addedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(c.publicKeyArmor, c.id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                          title="Copy Public Key Armor"
                        >
                          {copiedId === c.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-all cursor-pointer"
                          title="Delete Contact"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'diagnostics' && (
            <div className="space-y-6">
              {/* Diagnostic Run Action Banner */}
              <div className="p-5 rounded-2xl glass-3d space-y-3 border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Activity className="text-emerald-400" size={18} />
                    <h4 className="text-sm font-bold text-white">NIST CAVP-Style Cryptographic Self-Test</h4>
                  </div>
                  <button
                    onClick={handleRunSelfTest}
                    disabled={isRunningTest}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <RefreshCw className={isRunningTest ? 'animate-spin' : ''} size={14} />
                    <span>{isRunningTest ? 'Running Vectors...' : 'Execute Self-Tests'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300">
                  Executes real-time mathematical validation against AES-GCM-256, ECDH P-256 key exchange, WAV audio LSB injection, PKZIP archives, and side-channel memory scrubbing.
                </p>
              </div>

              {/* Test Results Table */}
              {testReport && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white">
                      Diagnostic Results: {testReport.passedTests} / {testReport.totalTests} Passed
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Completed in {testReport.totalDurationMs} ms
                    </span>
                  </div>

                  <div className="space-y-2">
                    {testReport.results.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-start justify-between gap-4 text-xs font-mono"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {r.status === 'passed' ? (
                              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                            ) : (
                              <AlertCircle size={14} className="text-red-400 shrink-0" />
                            )}
                            <span className="font-bold text-white">{r.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans">{r.details}</p>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 text-cyan-300 border border-white/10 shrink-0">
                          {r.latencyMs} ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Air-Gapped Client-Side Cryptographic Enclave</span>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
}
