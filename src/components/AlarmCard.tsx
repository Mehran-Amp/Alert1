import React from 'react';
import { Volume2, Smartphone, Mic, Timer, RefreshCw, Trash2, Zap } from 'lucide-react';
import { AlertRule, formatExchangeTag } from '../App';

export interface AlarmCardProps {
  rule: AlertRule;
  cryptoPrices: Record<string, any>;
  macroPrices: Record<string, any>;
  currentLang?: string;
  isLight?: boolean;
  isOrange?: boolean;
  checkingRuleId?: string | null;
  globalSoundEnabled?: boolean;
  globalVibrationEnabled?: boolean;
  globalTtsEnabled?: boolean;
  formatInterval?: (secs: number) => string;
  onToggle: (uuid: string) => void;
  onToggleFeedback: (uuid: string, type: 'sound' | 'vibration' | 'tts') => void;
  onManualCheck: (rule: AlertRule) => void;
  onDelete: (uuid: string) => void;
}

const defaultFormatInterval = (secs: number) => {
  if (secs >= 3600) return `${secs / 3600} ساعت`;
  if (secs >= 60) return `${secs / 60} دقیقه`;
  return `${secs} ثانیه`;
};

export const AlarmCard: React.FC<AlarmCardProps> = ({
  rule,
  cryptoPrices,
  macroPrices,
  currentLang = 'fa',
  isLight = false,
  isOrange = false,
  checkingRuleId = null,
  globalSoundEnabled = true,
  globalVibrationEnabled = true,
  globalTtsEnabled = true,
  formatInterval = defaultFormatInterval,
  onToggle,
  onToggleFeedback,
  onManualCheck,
  onDelete,
}) => {
  let iconUrl = '';
  let nameFa = rule.marketSymbol;
  let displayName = rule.marketSymbol;
  let unit = '$';

  if (rule.marketType === 'crypto') {
    const meta = cryptoPrices[rule.baseCurrency] || cryptoPrices.BTC;
    iconUrl = meta?.icon || '';
    nameFa = meta?.nameFa || rule.baseCurrency;
    displayName = currentLang === 'fa' ? nameFa : rule.baseCurrency;
    const isTmn = rule.counterCurrency === 'TMN' || rule.counterCurrency === 'IRT';
    unit = isTmn ? 'ت' : '$';
  } else {
    const meta = macroPrices[rule.baseCurrency] || macroPrices.US10Y;
    iconUrl = meta?.icon || '';
    nameFa = meta?.nameFa || rule.baseCurrency;
    displayName = currentLang === 'fa' ? nameFa : (meta?.name || rule.baseCurrency);
    unit = meta?.unit === 'تومان' ? 'ت' : (meta?.unit || '$');
  }

  const isChecking = checkingRuleId === rule.uuid;
  const displayP = rule.lastCheckedPrice ?? rule.basePrice;

  // Market 24h Meta & Effective Percentage Calculation
  const marketMeta =
    rule.marketType === 'crypto'
      ? cryptoPrices[rule.baseCurrency] || cryptoPrices.BTC
      : macroPrices[rule.baseCurrency] || macroPrices.US10Y;

  const deltaFromBase =
    rule.basePrice > 0 ? ((displayP - rule.basePrice) / rule.basePrice) * 100 : 0;
  const effectivePct =
    Math.abs(deltaFromBase) > 0.01 ? deltaFromBase : (marketMeta?.change24h ?? 0);
  const isZero = Math.abs(effectivePct) < 0.005;
  const isPositive = effectivePct > 0.005;

  // Proximity Calculation (0 to 100%)
  let targetProximity = 50;
  if (rule.conditionType === 'PRICE_THRESHOLD' && rule.targetValue > 0) {
    targetProximity = Math.min(100, Math.round((displayP / rule.targetValue) * 100));
  } else if (rule.conditionType === 'PERCENT_CHANGE' && rule.targetValue > 0) {
    const deltaPct = Math.abs(((displayP - rule.basePrice) / rule.basePrice) * 100);
    targetProximity = Math.min(100, Math.round((deltaPct / rule.targetValue) * 100));
  }

  return (
    <div
      className={`p-3 rounded-2xl border transition-all shadow-sm ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-slate-100'
          : rule.isActive
          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700/80 shadow-slate-950/30'
          : 'bg-slate-950/40 border-slate-900/60 opacity-60'
      }`}
    >
      {/* Header: Icon, Symbol/Name, Live Price & Toggle */}
      <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-slate-800/50">
        {/* Left / Start: Icon + Title info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <img
              src={iconUrl}
              alt={displayName}
              className="h-9 w-9 rounded-xl object-cover border border-slate-700/70 p-0.5 bg-slate-950"
              onError={(e) => {
                (e.target as any).src =
                  'https://cdn-icons-png.flaticon.com/512/2830/2830284.png';
              }}
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${
                rule.isActive ? 'bg-emerald-500 ring-1 ring-emerald-500/30' : 'bg-slate-600'
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="font-black text-xs text-white truncate max-w-[110px]"
                title={displayName}
              >
                {displayName}
              </span>
              <span className="text-[10px] font-mono text-slate-400 shrink-0 font-semibold">
                {rule.marketSymbol}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold tracking-wider bg-slate-800/90 text-slate-300 border border-slate-700/50 shrink-0 font-mono">
                {formatExchangeTag(rule.exchangeName)}
              </span>
            </div>
          </div>
        </div>

        {/* Right / End: Live Price & Switch */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right" dir="ltr">
            <div className="text-[13px] font-black font-mono tracking-tight text-white leading-tight">
              {unit === '$'
                ? `$${
                    displayP >= 1000
                      ? Math.round(displayP).toLocaleString()
                      : displayP < 1
                      ? displayP.toFixed(5)
                      : displayP.toFixed(2)
                  }`
                : `${
                    displayP >= 1000 ? Math.round(displayP).toLocaleString() : displayP.toFixed(2)
                  } ${
                    unit === 'تومان' || unit === 'TMN' || unit === 'IRT' ? 'ت' : unit
                  }`}
            </div>
            <div className="mt-0.5">
              {rule.isTriggered ? (
                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Done
                </span>
              ) : (
                <span
                  className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                    isZero
                      ? 'bg-slate-800 text-slate-400'
                      : isPositive
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  {isZero ? '• ' : isPositive ? '+' : ''}
                  {effectivePct.toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onToggle(rule.uuid)}
            className={`w-8 h-4.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
              rule.isActive
                ? isOrange
                  ? 'bg-orange-500'
                  : 'bg-emerald-500'
                : 'bg-slate-800 border border-slate-700'
            }`}
            title={rule.isActive ? 'روشن' : 'خاموش'}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                rule.isActive ? '-translate-x-3.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Middle: Target Proximity Progress Strip */}
      <div className="my-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800/50">
        <div className="flex items-center justify-between text-[10.5px] mb-1.5 gap-2">
          <div className="flex items-center gap-1 text-slate-300 min-w-0 flex-1">
            <Zap className="h-3 w-3 text-amber-400 shrink-0" />
            <span className="font-semibold truncate">
              {rule.conditionType === 'PERCENT_CHANGE'
                ? currentLang === 'fa'
                  ? `تغییر نرخ ${rule.direction === 'BOTH' ? '±' : rule.direction === 'ABOVE' ? '+' : '-'}${rule.targetValue}%`
                  : `Rate Change ${rule.direction === 'BOTH' ? '±' : rule.direction === 'ABOVE' ? '+' : '-'}${rule.targetValue}%`
                : rule.direction === 'BOTH'
                ? currentLang === 'fa'
                  ? `بالا: ${rule.upperTargetPrice?.toLocaleString() ?? '—'} | پایین: ${rule.lowerTargetPrice?.toLocaleString() ?? '—'}`
                  : `High: ${rule.upperTargetPrice?.toLocaleString() ?? '—'} | Low: ${rule.lowerTargetPrice?.toLocaleString() ?? '—'}`
                : currentLang === 'fa'
                ? `تارگت: ${rule.direction === 'ABOVE' ? 'بالای' : 'زیر'} ${rule.targetValue.toLocaleString()} ${unit}`
                : `Target: ${rule.direction === 'ABOVE' ? 'Above' : 'Below'} ${unit}${rule.targetValue.toLocaleString()}`}
            </span>
          </div>
          <span
            className={`font-mono font-bold text-[9.5px] shrink-0 ${
              rule.isTriggered
                ? 'text-amber-400'
                : targetProximity >= 85
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
            dir="ltr"
          >
            {rule.isTriggered
              ? 'Done'
              : rule.conditionType === 'PERCENT_CHANGE' && rule.direction === 'BOTH'
              ? 'Active'
              : `${targetProximity}%`}
          </span>
        </div>
        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              targetProximity >= 85
                ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(4, targetProximity)}%` }}
          />
        </div>
      </div>

      {/* Footer: Compact Toggle Chips (Sound, Vibe, Voice) + Interval & Actions */}
      <div className="flex items-center justify-between text-[10px] pt-1">
        {/* Left: Feedback Notification Badges */}
        <div className="flex items-center gap-1">
          {/* Sound */}
          <button
            type="button"
            onClick={() => onToggleFeedback(rule.uuid, 'sound')}
            title={
              !globalSoundEnabled
                ? 'صدای سراسری خاموش است'
                : (rule.soundEnabled ?? true)
                ? 'صدای زنگ فعال است'
                : 'صدای زنگ خاموش است'
            }
            className={`h-6 px-1.5 rounded-lg flex items-center gap-1 font-mono text-[9px] transition-all cursor-pointer border ${
              !globalSoundEnabled
                ? 'bg-slate-900 border-slate-800 text-slate-500 opacity-50'
                : (rule.soundEnabled ?? true)
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <Volume2 className="h-2.5 w-2.5" />
            <span>{currentLang === 'fa' ? 'صدا' : 'Snd'}</span>
          </button>

          {/* Vibration */}
          <button
            type="button"
            onClick={() => onToggleFeedback(rule.uuid, 'vibration')}
            title={
              !globalVibrationEnabled
                ? 'ویبره سراسری خاموش است'
                : (rule.vibrationEnabled ?? true)
                ? 'ویبره دستگاه فعال است'
                : 'ویبره دستگاه خاموش است'
            }
            className={`h-6 px-1.5 rounded-lg flex items-center gap-1 font-mono text-[9px] transition-all cursor-pointer border ${
              !globalVibrationEnabled
                ? 'bg-slate-900 border-slate-800 text-slate-500 opacity-50'
                : (rule.vibrationEnabled ?? true)
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <Smartphone className="h-2.5 w-2.5" />
            <span>{currentLang === 'fa' ? 'ویبره' : 'Vib'}</span>
          </button>

          {/* Voice */}
          <button
            type="button"
            onClick={() => onToggleFeedback(rule.uuid, 'tts')}
            title={
              !globalTtsEnabled
                ? 'اعلام صوتی سراسری خاموش است'
                : (rule.ttsEnabled ?? true)
                ? 'اعلام صوتی فعال است'
                : 'اعلام صوتی خاموش است'
            }
            className={`h-6 px-1.5 rounded-lg flex items-center gap-1 font-mono text-[9px] transition-all cursor-pointer border ${
              !globalTtsEnabled
                ? 'bg-slate-900 border-slate-800 text-slate-500 opacity-50'
                : (rule.ttsEnabled ?? true)
                ? 'bg-violet-500/15 border-violet-500/40 text-violet-400 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <Mic className="h-2.5 w-2.5" />
            <span>{currentLang === 'fa' ? 'صوتی' : 'TTS'}</span>
          </button>
        </div>

        {/* Right: Timer Interval + Refresh Check & Delete */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9.5px] font-mono text-slate-400 flex items-center gap-0.5">
            <Timer className="h-2.5 w-2.5 text-slate-500" />
            <span>{formatInterval(rule.checkIntervalSeconds)}</span>
          </span>

          <button
            onClick={() => onManualCheck(rule)}
            disabled={isChecking}
            className="h-6 px-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-emerald-400 flex items-center gap-1 text-[9.5px] font-bold border border-slate-700/60 transition-all cursor-pointer"
            title={currentLang === 'fa' ? 'بررسی آنی قیمت' : 'Check Now'}
          >
            <RefreshCw className={`h-2.5 w-2.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{currentLang === 'fa' ? 'چک' : 'Check'}</span>
          </button>

          <button
            onClick={() => onDelete(rule.uuid)}
            className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
            title={currentLang === 'fa' ? 'حذف هشدار' : 'Delete'}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlarmCard;
