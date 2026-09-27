import React, { useState, useEffect } from 'react';
import {
  Globe,
  LifeBuoy,
  Info,
  ChevronRight,
  ChevronLeft,
  Check,
  Play,
  X,
  Shield,
  Lock,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useLanguage, LANG_OPTIONS } from '../contexts/LanguageContext';
import { soundFx } from '../services/soundFx';
import {
  getPrivacyContent,
  getTermsContent,
  getGuidelinesContent,
  getThreatModelContent,
  getVideos,
  getBlogPosts,
  getAboutData,
  LocalizedBlogPost,
} from './settingsContent';

type ViewState =
  | 'main'
  | 'language'
  | 'support'
  | 'about'
  | 'threat_model'
  | 'terms'
  | 'privacy'
  | 'guidelines'
  | 'blog'
  | 'feedback'
  | 'blog_post'
  | 'demos';

interface SettingsProps {
  onOpenKeyring?: () => void;
  onOpenGuide?: () => void;
}

export default function Settings({ onOpenKeyring, onOpenGuide }: SettingsProps) {
  const { language, setLanguage, t } = useLanguage();
  const [activeView, setActiveView] = useState<ViewState>('main');

  const videos = getVideos(language);
  const blogPosts = getBlogPosts(language);
  const aboutData = getAboutData(language);

  const [selectedPost, setSelectedPost] = useState<LocalizedBlogPost | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedVideo(null);
    };
    if (selectedVideo) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVideo]);

  const handleBack = () => {
    soundFx.playClick();
    setActiveView('main');
  };

  const handleSupportBack = () => {
    soundFx.playClick();
    setActiveView('support');
  };

  const handleLanguageSelect = (lang: string) => {
    soundFx.playClick();
    setLanguage(lang as any);
    setActiveView('main');
  };

  const handleBlogClick = (post: LocalizedBlogPost) => {
    soundFx.playClick();
    setSelectedPost(post);
    setActiveView('blog_post');
  };

  // --- SUBVIEWS ---

  const renderMainView = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-5 sm:p-6 space-y-4">
        <div className="pb-4 border-b border-black/60 border-b-white/5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#211a2d] text-[#b39ddb] border border-black/50 border-t-[#b39ddb]/20 mb-2 shadow-inner">
            <Lock size={12} className="text-[#b39ddb]" />
            <span>Configuration & Cryptographic Whitepaper</span>
          </div>
          <h2 className="display-md text-[#f7fafc]">
            Settings & Specifications
          </h2>
          <p className="text-xs text-[#a0aec0] mt-1">
            System telemetry, cryptographic specs & zero-server-retention policy
          </p>
        </div>

        <div className="space-y-2.5">
          {/* Keyring & Enclave Studio */}
          {onOpenKeyring && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenKeyring();
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl card-inset hover:bg-[#121620] transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] text-[#b39ddb] shadow-sm">
                  <Lock size={17} />
                </div>
                <div>
                  <span className="font-bold text-white text-sm block group-hover:text-[#b39ddb] transition-colors">
                    Asymmetric Keyring & Diagnostics
                  </span>
                  <span className="text-xs font-mono text-[#718096]">
                    ECDH P-256 Keypairs, Contact Keys & NIST CAVP Self-Tests
                  </span>
                </div>
              </div>
              <ChevronRight className="text-[#718096] group-hover:text-white transition-colors" size={16} />
            </button>
          )}

          {/* Messenger Stealth Dispatcher Guide */}
          {onOpenGuide && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenGuide();
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl card-inset hover:bg-[#121620] transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] text-[#64b5f6] shadow-sm">
                  <Shield size={17} />
                </div>
                <div>
                  <span className="font-bold text-white text-sm block group-hover:text-[#64b5f6] transition-colors">
                    Stealth Messenger Dispatch Guide
                  </span>
                  <span className="text-xs font-mono text-[#718096]">
                    WhatsApp, Telegram, Signal & Discord Zero-Loss Compression Bypass
                  </span>
                </div>
              </div>
              <ChevronRight className="text-[#718096] group-hover:text-white transition-colors" size={16} />
            </button>
          )}

          {/* Language Selection */}
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveView('language');
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl card-inset hover:bg-[#121620] transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] text-[#52b788] shadow-sm">
                <Globe size={17} />
              </div>
              <div>
                <span className="font-bold text-white text-sm block group-hover:text-[#52b788] transition-colors">
                  Language & Localization
                </span>
                <span className="text-xs font-mono text-[#718096]">Current: {language}</span>
              </div>
            </div>
            <ChevronRight className="text-[#718096] group-hover:text-white transition-colors" size={16} />
          </button>

          {/* Video Guided Walkthroughs */}
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveView('demos');
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl card-inset hover:bg-[#121620] transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] text-[#e0a96d] shadow-sm">
                <Play size={17} />
              </div>
              <div>
                <span className="font-bold text-white text-sm block group-hover:text-[#e0a96d] transition-colors">
                  Video Guided Walkthroughs
                </span>
                <span className="text-xs font-mono text-[#718096]">
                  Step-by-step masterclasses on steganographic workflows
                </span>
              </div>
            </div>
            <ChevronRight className="text-[#718096] group-hover:text-white transition-colors" size={16} />
          </button>

          {/* Support & Documentation */}
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveView('support');
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl card-inset hover:bg-[#121620] transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] text-[#74c69d] shadow-sm">
                <LifeBuoy size={17} />
              </div>
              <div>
                <span className="font-bold text-white text-sm block group-hover:text-[#74c69d] transition-colors">
                  Documentation & Support
                </span>
                <span className="text-xs font-mono text-[#718096]">
                  Cryptographic whitepapers, privacy policies & threat models
                </span>
              </div>
            </div>
            <ChevronRight className="text-[#718096] group-hover:text-white transition-colors" size={16} />
          </button>

          {/* About Enclave */}
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveView('about');
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl card-inset hover:bg-[#121620] transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] text-[#a0aec0] shadow-sm">
                <Info size={17} />
              </div>
              <div>
                <span className="font-bold text-white text-sm block group-hover:text-white transition-colors">
                  About QuietSend
                </span>
                <span className="text-xs font-mono text-[#718096]">
                  Architecture details & client sandbox specifications
                </span>
              </div>
            </div>
            <ChevronRight className="text-[#718096] group-hover:text-white transition-colors" size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderLanguageView = () => (
    <div className="card p-5 sm:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-black/60 border-b-white/5 pb-3">
        <button onClick={handleBack} className="btn btn-secondary !p-2 cursor-pointer">
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-base font-bold text-white">Select Display Language</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {LANG_OPTIONS.map((opt) => (
          <button
            key={opt.code}
            onClick={() => handleLanguageSelect(opt.code)}
            className={`flex items-center justify-between p-3.5 rounded-lg card-inset transition-all cursor-pointer ${
              language === opt.code ? 'border-emerald-500/50 bg-[#122019]' : 'hover:bg-[#121620]'
            }`}
          >
            <span className="font-bold text-sm text-white">{opt.label}</span>
            {language === opt.code && <Check size={16} className="text-[#52b788]" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSupportView = () => (
    <div className="card p-5 sm:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-black/60 border-b-white/5 pb-3">
        <button onClick={handleBack} className="btn btn-secondary !p-2 cursor-pointer">
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-base font-bold text-white">Documentation & Support</h3>
      </div>
      <div className="space-y-2">
        {[
          { id: 'threat_model', label: t.settings.threat_model, desc: 'What QuietSend resists and what it does not' },
          { id: 'privacy', label: 'Zero-Server-Retention Privacy Policy', desc: 'Complete client-side sandbox isolation' },
          { id: 'terms', label: 'Terms of Service', desc: 'Open license & operational boundaries' },
          { id: 'guidelines', label: 'Operational Security Guidelines', desc: 'Preventing differential steganography leaks' },
          { id: 'blog', label: 'Cryptographic Whitepapers', desc: 'Technical documentation & research' },
          { id: 'feedback', label: 'Send Feedback & Security Reports', desc: 'Direct contact with maintainers' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              soundFx.playClick();
              setActiveView(item.id as ViewState);
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-lg card-inset hover:bg-[#121620] transition-all cursor-pointer group text-left"
          >
            <div>
              <span className="font-bold text-sm text-white block group-hover:text-[#52b788] transition-colors">
                {item.label}
              </span>
              <span className="text-xs font-mono text-[#718096]">{item.desc}</span>
            </div>
            <ChevronRight className="text-[#718096] group-hover:text-white" size={16} />
          </button>
        ))}
      </div>
    </div>
  );

  const renderAboutView = () => (
    <div className="card p-5 sm:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-black/60 border-b-white/5 pb-3">
        <button onClick={handleBack} className="btn btn-secondary !p-2 cursor-pointer">
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-base font-bold text-white">About QuietSend Enclave</h3>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {aboutData.cards.map((c, i) => (
            <div key={i} className="card-inset p-3.5 space-y-1">
              <span className="text-[10px] font-mono font-bold text-[#a0aec0] uppercase">{c.label}</span>
              <p className="text-base font-bold text-white font-mono">{c.val}</p>
              <p className="text-[11px] text-[#718096]">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="card-inset p-4 space-y-2">
          <h4 className="text-xs font-mono font-bold text-[#52b788] uppercase">{aboutData.tableTitle}</h4>
          <div className="space-y-1.5 text-xs font-mono">
            {aboutData.table.map(([k, v], i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-black/40 border-b-white/5">
                <span className="text-[#a0aec0]">{k}</span>
                <span className="text-white font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSimpleTextView = (title: string, content: React.ReactNode) => (
    <div className="card p-5 sm:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-black/60 border-b-white/5 pb-3">
        <button onClick={handleSupportBack} className="btn btn-secondary !p-2 cursor-pointer">
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-base font-bold text-white">{title}</h3>
      </div>
      <div className="card-inset p-4 text-xs text-[#a0aec0] leading-relaxed font-sans">
        {content}
      </div>
    </div>
  );

  const renderDemosView = () => {
    const activeVideoObj = videos.find((v) => v.src === selectedVideo);

    return (
      <div className="card p-5 sm:p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3 border-b border-black/60 border-b-white/5 pb-3">
          <button
            type="button"
            onClick={handleBack}
            className="btn btn-secondary !p-2 cursor-pointer"
            aria-label="Back to Settings"
          >
            <ChevronLeft size={16} />
          </button>
          <h3 className="text-base font-bold text-white">Video Guided Walkthroughs</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videos.map((v, i) => (
            <button
              type="button"
              key={`${v.title}-${i}`}
              onClick={() => {
                soundFx.playClick();
                setVideoFailed(false);
                setSelectedVideo(v.src);
              }}
              className="card-inset p-4 hover:bg-[#121620] transition-all cursor-pointer group space-y-2 text-left w-full focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-[#1c222e] text-[#a0aec0]">
                  {v.difficulty}
                </span>
                <Play size={15} className="text-[#64b5f6] group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="font-bold text-white text-sm group-hover:text-[#64b5f6] transition-colors">{v.title}</h4>
              <p className="text-xs text-[#718096]">{v.desc}</p>
            </button>
          ))}
        </div>

        {selectedVideo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedVideo(null)}
            role="dialog"
            aria-modal="true"
            aria-label={activeVideoObj?.title || 'Video Guided Walkthrough'}
          >
            <div
              className="relative max-w-3xl w-full rounded-2xl overflow-hidden card p-4 shadow-2xl border-black/70 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h4 className="text-sm font-bold text-white">{activeVideoObj?.title || 'Tutorial Walkthrough'}</h4>
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/20 cursor-pointer"
                  aria-label="Close video walkthrough"
                >
                  <X size={16} />
                </button>
              </div>
              {videoFailed ? (
                <div className="card-inset flex aspect-video items-center justify-center p-6 text-center text-sm text-[#a0aec0]">
                  The video file is unavailable in this deployment. Use the written walkthrough below.
                </div>
              ) : (
                <video
                  src={selectedVideo}
                  controls
                  preload="metadata"
                  onError={() => setVideoFailed(true)}
                  className="w-full rounded-xl aspect-video bg-black"
                />
              )}
              {activeVideoObj && (
                <div className="card-inset p-3.5 text-xs text-[#a0aec0] space-y-2 max-h-52 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                      Step-by-Step Written Walkthrough
                    </p>
                    <span className="text-[10px] font-mono text-[#64b5f6]">
                      {activeVideoObj.difficulty}
                    </span>
                  </div>
                  <p className="text-[#a0aec0] italic">{activeVideoObj.desc}</p>
                  <ol className="space-y-1.5 list-decimal list-inside text-slate-300 font-sans leading-relaxed pt-1">
                    {activeVideoObj.steps.map((step, idx) => (
                      <li key={idx} className="text-slate-200">
                        <span className="text-slate-300">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {activeView === 'main' && renderMainView()}
      {activeView === 'language' && renderLanguageView()}
      {activeView === 'support' && renderSupportView()}
      {activeView === 'about' && renderAboutView()}
      {activeView === 'demos' && renderDemosView()}
      {activeView === 'threat_model' &&
        renderSimpleTextView(
          t.settings.threat_model,
          getThreatModelContent(language)
        )}
      {activeView === 'privacy' &&
        renderSimpleTextView(
          t.settings.privacy || 'Zero-Server-Retention Privacy Policy',
          getPrivacyContent(language)
        )}
      {activeView === 'terms' &&
        renderSimpleTextView(
          t.settings.terms || 'Terms of Service',
          getTermsContent(language)
        )}
      {activeView === 'guidelines' &&
        renderSimpleTextView(
          t.settings.guidelines || 'Security Guidelines',
          getGuidelinesContent(language)
        )}
      {activeView === 'blog' && (
        <div className="card p-5 sm:p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 border-b border-black/60 border-b-white/5 pb-3">
            <button onClick={handleSupportBack} className="btn btn-secondary !p-2 cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <h3 className="text-base font-bold text-white">Forensic Research Articles</h3>
          </div>
          <div className="space-y-2.5">
            {blogPosts.map((post) => (
              <button
                type="button"
                key={post.id}
                onClick={() => handleBlogClick(post)}
                className="card-inset w-full text-left p-4 hover:bg-[#121620] transition-all cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-[#52b788]">
                  <span>{post.date} · {post.readTime}</span>
                  <ChevronRight size={15} className="text-[#718096] group-hover:text-white" />
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-[#52b788] transition-colors">
                  {post.title}
                </h4>
                <p className="text-xs text-[#a0aec0] leading-relaxed">{post.summary}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      {activeView === 'blog_post' && selectedPost && (
        <div className="card p-5 sm:p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 border-b border-black/60 border-b-white/5 pb-3">
            <button onClick={() => setActiveView('blog')} className="btn btn-secondary !p-2 cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <h3 className="text-base font-bold text-white">{selectedPost.title}</h3>
          </div>
          <div className="card-inset p-5 text-xs text-[#a0aec0] space-y-3 leading-relaxed whitespace-pre-wrap">
            {selectedPost.content}
          </div>
        </div>
      )}
      {activeView === 'feedback' && (
        <div className="card p-5 sm:p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 border-b border-black/60 border-b-white/5 pb-3">
            <button onClick={handleSupportBack} className="btn btn-secondary !p-2 cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <h3 className="text-base font-bold text-white">Send Feedback & Security Findings</h3>
          </div>
          <div className="card-inset p-4 space-y-3 text-xs text-[#a0aec0]">
            <p>Share suggestions, bug reports, or security findings with the maintainers.</p>
            <div className="space-y-2 pt-2">
              <a
                href="https://github.com/tejas-ai/ghostbyte/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundFx.playClick()}
                className="btn btn-secondary w-full justify-between !py-2.5 !px-4 cursor-pointer text-xs"
              >
                <span>Open Public GitHub Issue</span>
                <ChevronRight size={15} />
              </a>
              <a
                href="mailto:security@quietsend.app?subject=QuietSend+Security+Finding"
                onClick={() => soundFx.playClick()}
                className="btn btn-secondary w-full justify-between !py-2.5 !px-4 cursor-pointer text-xs"
              >
                <span>Email Private Security Finding</span>
                <ChevronRight size={15} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
