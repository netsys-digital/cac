export function HeroLandscape() {
  return (
    <div className="relative aspect-[1.08/1] w-full max-w-[570px] overflow-hidden rounded-[28px] bg-gradient-to-b from-[#dcebed] via-[#eff8f2] to-[#b7ce98] shadow-[0_32px_75px_rgba(0,0,0,.22)]">
      <div className="absolute top-[13%] right-[12%] h-[75px] w-[75px] rounded-full bg-[#f3ce73]" />
      <div
        className="absolute bottom-[26%] left-[-6%] h-[57%] w-[78%] bg-[#789c71]"
        style={{
          clipPath: 'polygon(0 100%,15% 53%,31% 68%,49% 22%,66% 63%,82% 41%,100% 100%)',
        }}
      />
      <div
        className="absolute right-[-5%] bottom-[22%] h-[49%] w-[67%] bg-[#476f58]"
        style={{ clipPath: 'polygon(0 100%,26% 38%,48% 68%,70% 16%,100% 100%)' }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[43%] bg-gradient-to-b from-[#94b77f] to-[#567b5c]" />
      <div
        className="absolute right-[7%] bottom-[11%] left-[6%] h-[42%] -skew-y-[11deg] border-t-4 border-[rgba(241,245,216,.66)] shadow-[0_28px_0_rgba(241,245,216,.44),0_56px_0_rgba(241,245,216,.30)]"
      />
      <div className="absolute right-[19%] bottom-[33%] h-[182px] w-1 bg-[#eff5f3] before:absolute before:top-0 before:left-[-55px] before:h-1 before:w-[111px] before:bg-[#eff5f3] before:content-['']" />
      <div className="absolute bottom-[19%] left-[11%] h-[20%] w-[24%] -skew-x-[8deg] border-2 border-white/70 bg-[rgba(241,252,249,.3)]" />
      <div className="absolute bottom-[17px] left-[18px] rounded-[11px] bg-[rgba(10,36,64,.85)] px-[13px] py-[11px] text-[10px] font-black text-white">
        Tecnologia • Agricultura • Clima • Ação
      </div>
    </div>
  );
}
