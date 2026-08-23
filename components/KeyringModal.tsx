import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  UserCheck,
  Lock,
} from 'lucide-react';
import { soundFx } from '../services/soundFx';
import {
  generateAsymmetricKeyPair,
  getStoredKeyring,
  saveStoredKeyring,
  getStoredContacts,
  saveStoredContacts,
  addContactPublicKey,
  exportEncryptedBackup,
  importEncryptedBackup,
  type KeyPairInfo,
  type ContactPublicKey,
} from '../services/asymmetricCrypto';
import { downloadBlob } from '../services/stegaEngine';
import { runCryptoSelfTests, type SelfTestReport } from '../services/cryptoSelfTest';

interface KeyringModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type KeyringTab = 'identity' | 'contacts' | 'diagnostics';

/** In-app confirmation dialog replacing window.confirm / window.alert. */
function InlineConfirm({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0c1020] border border-white/20 rounded-2xl p-6 space-y-4 shadow-2xl">
        <p className="text-sm text-white font-medium">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/** Passphrase-entry dialog for encrypted backup export/import. */
function BackupPassphraseDialog({
  mode,
  onSubmit,
  onCancel,
  error,
}: {
  mode: 'export' | 'import';
  onSubmit: (pass: string, file?: File) => void;
  onCancel: () => void;
  error: string;
}) {
  const [pass, setPass] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSubmit(pass, file ?? undefined);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0c1020] border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock size={14} className="text-cyan-400" />
          {mode === 'export' ? 'Encrypt Backup' : 'Decrypt Backup'}
        </h4>
        <p className="text-xs text-slate-400">
          {mode === 'export'
            ? 'Choose a strong passphrase. The backup file will be AES-GCM-256 encrypted — this passphrase is the only way to restore it.'
            : 'Enter the passphrase you used when exporting this backup.'}
        </p>

        {mode === 'import' && (
          <label className="block text-xs text-slate-300 font-bold">
            Backup file
            <input
              type="file"
              accept=".json"
              className="mt-1 block w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-600/30 file:text-cyan-300 file:font-bold file:cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        <div>
          <label htmlFor="backup-pass" className="block text-xs text-slate-300 font-bold mb-1">
            Backup passphrase
          </label>
          <input
            ref={inputRef}
            id="backup-pass"
            type="password"
            placeholder={mode === 'export' ? 'At least 8 characters…' : 'Enter passphrase…'}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={handleKey}
            className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(pass, file ?? undefined)}
            disabled={!pass || (mode === 'import' && !file)}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
          >
            {mode === 'export' ? 'Encrypt & Download' : 'Restore Backup'}
          </button>
        </div>
      </div>
    </div>
  );
}

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

  // In-app confirm dialog state (replaces window.confirm)
  const [confirmState, setConfirmState] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Backup dialog state
  const [backupDialog, setBackupDialog] = useState<'export' | 'import' | null>(null);
  const [backupError, setBackupError] = useState('');

  // Focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Focus the close button on open
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard handler: Escape closes, Tab traps focus
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        soundFx.playClick();
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const loadData = () => {
    const storedKeys = getStoredKeyring();
    if (storedKeys.length === 0) {
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
    } catch {
      soundFx.playError();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteKey = (id: string) => {
    soundFx.playClick();
    if (keyring.length <= 1) {
      setConfirmState({
        message: 'You must maintain at least one identity keypair in your enclave.',
        onConfirm: () => setConfirmState(null),
      });
      return;
    }
    setConfirmState({
      message: 'Permanently delete this keypair from browser storage? This cannot be undone.',
      onConfirm: () => {
        const updated = keyring.filter((k) => k.id !== id);
        saveStoredKeyring(updated);
        setKeyring(updated);
        setConfirmState(null);
      },
    });
  };

  const handleAddContact = async () => {
    soundFx.playClick();
    setContactError('');
    if (!contactArmor.trim()) {
      setContactError('Please paste a valid Public Key armor block.');
      return;
    }
    try {
      await addContactPublicKey(contactName, contactArmor);
      setContacts(getStoredContacts());
      setContactName('');
      setContactArmor('');
      soundFx.playSuccess();
    } catch (err: unknown) {
      setContactError((err instanceof Error ? err.message : null) || 'Invalid public key format.');
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
    navigator.clipboard.writeText(text).catch(() => {/* non-secure origin */ });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Encrypted backup export ────────────────────────────────────────────────
  const handleExportBackup = async (passphrase: string) => {
    setBackupError('');
    try {
      const blob = await exportEncryptedBackup(keyring, contacts, passphrase);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      downloadBlob(bytes, `quietsend_keyring_backup_${Date.now()}.json`);
      soundFx.playSuccess();
      setBackupDialog(null);
    } catch (err: unknown) {
      setBackupError((err instanceof Error ? err.message : null) || 'Export failed.');
      soundFx.playError();
    }
  };

  // ── Encrypted backup import ────────────────────────────────────────────────
  const handleImportBackup = async (passphrase: string, file?: File) => {
    setBackupError('');
    if (!file) { setBackupError('Select a backup file first.'); return; }
    try {
      const text = await file.text();
      const { keyring: restoredKeys, contacts: restoredContacts } = await importEncryptedBackup(text, passphrase);
      saveStoredKeyring(restoredKeys);
      saveStoredContacts(restoredContacts);
      setKeyring(restoredKeys);
      setContacts(restoredContacts);
      soundFx.playSuccess();
      setBackupDialog(null);
    } catch (err: unknown) {
      setBackupError((err instanceof Error ? err.message : null) || 'Restore failed — wrong passphrase or corrupt file.');
      soundFx.playError();
    }
  };

  const handleRunSelfTest = async () => {
    soundFx.playClick();
    setIsRunningTest(true);
    try {
      const report = await runCryptoSelfTests();
      setTestReport(report);
      if (report.overallPass) soundFx.playSuccess();
      else soundFx.playError();
    } finally {
      setIsRunningTest(false);
    }
  };

  if (!isOpen) return null;

  const activeKey = keyring[0];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={() => { soundFx.playClick(); onClose(); }}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyring-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="relative w-full max-w-3xl bg-[#080c16] border border-cyan-500/40 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto"
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
                <h3 id="keyring-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                  <span>Asymmetric Keyring &amp; Enclave Studio</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    ECDH P-256
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Manage public/private keys and cryptographic verification vectors.</p>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              onClick={() => { soundFx.playClick(); onClose(); }}
              aria-label="Close keyring modal"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex px-6 pt-3 border-b border-white/10 bg-black/40 gap-2" role="tablist">
            {(
              [
                { id: 'identity', label: `My Keypair (${keyring.length})`, icon: <ShieldCheck size={14} />, color: 'cyan' },
                { id: 'contacts', label: `Contact Public Keys (${contacts.length})`, icon: <UserCheck size={14} />, color: 'purple' },
                { id: 'diagnostics', label: 'CAVP Diagnostic Suite', icon: <Activity size={14} />, color: 'emerald' },
              ] as const
            ).map(({ id, label, icon, color }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => { soundFx.playClick(); setTab(id); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  tab === id
                    ? `border-${color}-400 text-${color}-300 bg-${color}-500/10 rounded-t-lg`
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
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
                          aria-label="Copy public key armor"
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
                        aria-label="Public key armor text"
                        className="w-full p-2.5 rounded-lg bg-black/70 border border-white/10 text-[10px] font-mono text-slate-300 select-all resize-none focus:outline-none"
                      />
                    </div>

                    {/* Delete key (only if multiple) */}
                    {keyring.length > 1 && (
                      <button
                        onClick={() => handleDeleteKey(activeKey.id)}
                        aria-label="Delete this keypair"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Delete This Keypair</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Generate New Keypair Section */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Plus size={14} className="text-cyan-400" />
                    <span>Generate Additional Identity Keypair</span>
                  </h5>
                  <div className="flex gap-2">
                    <label htmlFor="new-key-name" className="sr-only">Identity label</label>
                    <input
                      id="new-key-name"
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

                {/* Encrypted Backup & Restore Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs gap-3">
                  <div className="space-y-0.5">
                    <p className="text-amber-300 font-bold flex items-center gap-1.5">
                      <Lock size={12} />
                      Encrypted Keyring Backup
                    </p>
                    <p className="text-slate-400">Backups are AES-GCM-256 encrypted — a passphrase is required.</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { soundFx.playClick(); setBackupError(''); setBackupDialog('export'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold transition-all cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Export</span>
                    </button>
                    <button
                      onClick={() => { soundFx.playClick(); setBackupError(''); setBackupDialog('import'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold transition-all cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>Restore</span>
                    </button>
                  </div>
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
                    <label htmlFor="contact-name" className="sr-only">Contact name</label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Contact Name (e.g. Alice, Project Lead)"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                    />
                    <label htmlFor="contact-armor" className="sr-only">Contact public key armor</label>
                    <textarea
                      id="contact-armor"
                      placeholder="Paste -----BEGIN QUIETSEND PUBLIC KEY----- Armor Block..."
                      value={contactArmor}
                      onChange={(e) => setContactArmor(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 rounded-lg bg-black/60 border border-white/15 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                    />
                    {contactError && (
                      <p className="text-xs text-red-400 font-semibold" role="alert">{contactError}</p>
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
                            aria-label={`Copy public key for ${c.name}`}
                          >
                            {copiedId === c.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-all cursor-pointer"
                            aria-label={`Delete contact ${c.name}`}
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
                    Executes real-time mathematical validation against AES-GCM-256, ECDH P-256 + HKDF-SHA-256, WAV audio LSB injection, PKZIP archives, and dual-vault deniability.
                  </p>
                </div>

                {testReport && (
                  <div className="space-y-3" aria-live="polite" aria-label="Test results">
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
              <span>Client-Side Cryptographic Enclave — keys never leave this device</span>
            </div>
            <button
              onClick={() => { soundFx.playClick(); onClose(); }}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Close Studio
            </button>
          </div>
        </div>
      </div>

      {/* In-app confirm dialog */}
      {confirmState && (
        <InlineConfirm
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {/* Backup passphrase dialog */}
      {backupDialog && (
        <BackupPassphraseDialog
          mode={backupDialog}
          onSubmit={backupDialog === 'export' ? handleExportBackup : handleImportBackup}
          onCancel={() => { setBackupDialog(null); setBackupError(''); }}
          error={backupError}
        />
      )}
    </>
  );
}
