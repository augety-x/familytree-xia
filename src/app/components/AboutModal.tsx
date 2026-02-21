"use client";

import { XMarkIcon } from '@heroicons/react/24/outline';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const GENERATION_NAMES = [
  ['斌', '仲', '得', '文', '如', '祖', '靖', '季'],
  ['道', '德', '守', '志', '仁', '义', '维', '时'],
  ['忠', '信', '光', '元', '盛', '世', '兴', '平'],
  ['隆', '发', '荣', '宗', '永', '保', '富', '贵'],
];

export default function AboutModal({ open, onClose }: AboutModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-lg font-semibold text-gray-800">关于族谱</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 text-gray-700">
          {/* Basic info */}
          <section>
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900 tracking-wider">会稽郡夏氏宗谱</h3>
              <p className="text-sm text-gray-500 mt-1">遵欧苏二公遗式</p>
              <p className="text-sm text-gray-500">公元一九九七年岁次丁丑重修</p>
              <p className="text-xs text-gray-400 mt-1">瑞安市平阳坑镇南山路林宝庄梓辑</p>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Preface */}
          <section>
            <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-500 rounded-full inline-block"></span>
              夏氏重修宗谱新序
            </h4>
            <div className="text-sm leading-7 text-gray-600 text-justify indent-8">
              <p>
                编修宗谱乃我中华民族优良之传统。盖闻古帝王赐姓立宗，因氏立族。宗有大小之殊，族有远近之分，故有立宗族定邦国之说。编修宗谱自古及今，文人贤士累世相传，支繁派衍，散居四方。一族之兴，必有一族之谱。
              </p>
              <p className="mt-2">
                夏氏本夏后氏之后，后有帝乔氏封为通国王，配庸氏生二子。谱贤后因架不道，抱祭器而逃于泽河。至二世复号祖德，迁居会稽郡。再四世有泠心者，为周宣王保驾功成。又数世有滑登者，晋惠帝时官拜左丞相。再数世谨荣公封为大将军。再四世通元公为南征大将军。又三世阳嘉公者，居江九节度使，宦游浙水抵苍而居。续有听公者居景邑绿草。其十一世万九公卜迁峰源夏钟，迄今历六百余年，子孙繁衍。后因时代变幻，夏氏宗谱断近八十余年矣。
              </p>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Generation names */}
          <section>
            <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-500 rounded-full inline-block"></span>
              排行字母
            </h4>
            <p className="text-xs text-gray-500 mb-3">每字对应一世，自第二世起依次排列：</p>
            <div className="bg-amber-50/60 rounded-lg p-4 border border-amber-100">
              <div className="grid grid-cols-4 gap-y-1">
                {GENERATION_NAMES.map((row, rowIdx) =>
                  row.map((ch, colIdx) => {
                    const genNum = rowIdx * 8 + colIdx + 2;
                    return (
                      <div key={`${rowIdx}-${colIdx}`} className="flex items-center gap-2 py-1">
                        <span className="text-[10px] text-gray-400 w-5 text-right">{genNum}</span>
                        <span className="text-lg font-serif text-gray-800">{ch}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Origin note */}
          <section>
            <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-green-500 rounded-full inline-block"></span>
              始祖源流
            </h4>
            <div className="text-sm leading-7 text-gray-600">
              <p>
                始祖<span className="font-semibold text-gray-800">万九公</span>，龟四公四子，字景胜，名月和。赘娶萧氏，来绍兴会稽横路，生六人十六大义。公墓及萧氏墓在横路大坪后。
              </p>
              <p className="mt-2">
                万九公下传三支：长子<span className="font-semibold">斌一</span>、次子<span className="font-semibold">斌二</span>（娶氏生三子）、三子<span className="font-semibold">斌三</span>（娶李氏生二子，靖积萧义路邑一都）。三房即斌三公支系。
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
