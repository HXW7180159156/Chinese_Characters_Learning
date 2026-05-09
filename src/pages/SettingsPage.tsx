import { useSettingsStore } from '@/store/settingsStore'

export default function SettingsPage() {
  const { soundEnabled, toggleSound, fontSize, setFontSize } = useSettingsStore()

  return (
    <div className="pt-6 pb-4 max-w-md mx-auto">
      <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-5">⚙️ 设置</h1>

      <div className="card-kid divide-y divide-gray-100">
        {/* 音效开关 */}
        <div className="p-4 flex justify-between items-center">
          <div>
            <div className="font-bold">🔊 音效</div>
            <div className="text-xs text-gray-400">开启读音示范和音效反馈</div>
          </div>
          <button
            onClick={toggleSound}
            className={`w-14 h-7 rounded-full transition-colors ${soundEnabled ? 'bg-kid-green' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mx-1 ${soundEnabled ? 'translate-x-7' : ''}`} />
          </button>
        </div>

        {/* 字号 */}
        <div className="p-4">
          <div className="font-bold mb-2">📝 字号大小</div>
          <div className="flex gap-2">
            {(['normal', 'large', 'xlarge'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${fontSize === size ? 'bg-kid-blue text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                {size === 'normal' ? '标准' : size === 'large' ? '大' : '特大'}
              </button>
            ))}
          </div>
        </div>

        {/* 主题 */}
        <div className="p-4">
          <div className="font-bold mb-2">🎨 主题配色</div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-xl bg-kid-bg text-gray-700 font-bold text-sm border-2 border-kid-yellow">
              彩色乐园
            </button>
            <button className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm">
              简约模式
            </button>
          </div>
        </div>

        {/* 关于 */}
        <div className="p-4">
          <div className="font-bold text-sm text-center text-gray-400">
            汉字小探险 v1.0.0
          </div>
        </div>
      </div>
    </div>
  )
}
