import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone,
  X,
  Copy,
  Check,
  Wifi,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function PhoneSyncModal() {
  const { isPhoneModalOpen, setIsPhoneModalOpen, networkInfo } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isPhoneModalOpen) return null;

  // Compute mobile URL
  const phoneUrl = networkInfo?.clientUrl || `http://${window.location.hostname}:3000`;

  const handleCopy = () => {
    navigator.clipboard.writeText(phoneUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-5">
        
        {/* Close Button */}
        <button
          onClick={() => setIsPhoneModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Sync with Phone 📱</h3>
            <p className="text-xs text-slate-400">
              Control your study timer & goals directly from your phone!
            </p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-inner mx-auto max-w-[240px]">
          <QRCodeSVG
            value={phoneUrl}
            size={190}
            level="M"
            includeMargin={true}
          />
          <span className="text-[11px] font-semibold text-slate-700 mt-2">
            Scan with Phone Camera
          </span>
        </div>

        {/* Direct Link & Copy */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 block">
            Or open this URL directly in your phone's browser:
          </label>
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl p-1.5 pl-3">
            <span className="text-xs font-mono text-indigo-300 truncate flex-1 select-all">
              {phoneUrl}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 3 Step Guide */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-300">
          <div className="flex items-start gap-2">
            <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Step 1:</strong> Make sure your phone is connected to the same Wi-Fi network.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Smartphone className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Step 2:</strong> Scan the QR code using your phone camera (iPhone / Android).
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Step 3:</strong> That's it! Any timer start, pause, lap, or goal check on your phone will sync instantly on your laptop!
            </span>
          </div>
        </div>

        {/* Close action */}
        <div className="pt-1">
          <button
            onClick={() => setIsPhoneModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}
