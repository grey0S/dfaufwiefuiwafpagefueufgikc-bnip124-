import React, { useRef, useEffect, useState } from "react";
import { Share2, Download } from "lucide-react";

export default function SocialShare({ quest, user }: { quest: any, user: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    canvasRef.current.width = 1080;
    canvasRef.current.height = 1920;

    // Background Dark Neon
    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(0, 0, 1080, 1920);

    // Inner Neon Borders
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 15;
    ctx.strokeRect(60, 60, 960, 1800);
    ctx.strokeStyle = "rgba(0, 255, 204, 0.3)";
    ctx.lineWidth = 30;
    ctx.strokeRect(60, 60, 960, 1800);

    // Title / Header
    ctx.fillStyle = "#00ffcc";
    ctx.font = "900 90px sans-serif";
    ctx.fillText("SIDE QUEST", 120, 250);
    ctx.fillText("COMPLETED!", 120, 350);

    // Difficulty Box
    ctx.fillStyle = "#ff00ff"; // Just generalized neon for mockup
    ctx.fillRect(120, 450, 400, 80);
    ctx.fillStyle = "#000000";
    ctx.font = "bold 50px sans-serif";
    ctx.fillText(quest.difficulty.toUpperCase(), 150, 505);

    // Quest Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 80px sans-serif";
    // Quick wrap text
    const words = quest.title.split(" ");
    let line = "";
    let y = 700;
    for (let i = 0; i < words.length; i++) {
      let testLine = line + words[i] + " ";
      if (ctx.measureText(testLine).width > 800 && i > 0) {
        ctx.fillText(line, 120, y);
        line = words[i] + " ";
        y += 90;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 120, y);

    // Divider
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(120, y + 100, 840, 5);

    // User Identity
    ctx.fillStyle = "#0099ff";
    ctx.font = "bold 60px sans-serif";
    ctx.fillText(`@${user.username}`, 120, 1500);
    
    ctx.fillStyle = "#94a3b8";
    ctx.font = "50px sans-serif";
    ctx.fillText(`RANK: ${user.rank.toUpperCase()}`, 120, 1580);

    // Rewards
    ctx.fillStyle = "#00ffcc";
    ctx.font = "bold 80px sans-serif";
    ctx.fillText("+ XP REWARDED", 120, 1680);

    // Branding Footer
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 120px sans-serif";
    ctx.fillText("sec-ondary", 120, 1800);

    // Set Data URL for Download
    setImageUrl(canvasRef.current.toDataURL("image/png"));
  }, [quest, user]);

  return (
    <div className="flex flex-col items-center mt-6 p-6 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-neon)] shadow-[0_0_20px_rgba(0,255,204,0.1)]">
      <h4 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
        <Share2 className="w-5 h-5 text-[var(--accent-neon)]" /> Share your victory
      </h4>
      <p className="text-[var(--text-secondary)] text-sm mb-6 text-center">
        Download your personalized quest card to post on Instagram or TikTok!
      </p>
      
      <canvas ref={canvasRef} style={{ display: "none" }} />
      
      {imageUrl && (
        <a 
          href={imageUrl} 
          download={`sec-ondary-victory.png`}
          className="w-full bg-[var(--accent-neon)] text-black py-4 rounded-lg font-black flex justify-center items-center gap-2 hover:shadow-[0_0_20px_var(--accent-neon)] transition-all uppercase tracking-widest"
        >
          <Download className="w-5 h-5" /> Download Story Image
        </a>
      )}
    </div>
  );
}
