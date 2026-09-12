const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const canvasSequenceCode = `
import { useScroll, useTransform, AnimatePresence, useMotionValueEvent, MotionValue } from "framer-motion";

const CanvasSequence = ({ scrollProgress }: { scrollProgress: MotionValue<number> }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  useEffect(() => {
    let loadedCount = 0;
    const totalFrames = 306;
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.src = \`/camel/\${i.toString().padStart(3, '0')}.png\`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          setImagesLoaded(true);
        }
      }
      images.current.push(img);
    }
  }, []);

  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas || images.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const img = images.current[frameIndex];
    if (img && img.complete) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / 2) - (img.width / 2) * scale;
      const y = (canvas.height / 2) - (img.height / 2) * scale;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }
  };

  useEffect(() => {
    if (imagesLoaded) {
      drawFrame(0);
    }
  }, [imagesLoaded]);

  useMotionValueEvent(scrollProgress, "change", (latest) => {
    const frameIndex = Math.min(305, Math.max(0, Math.floor(latest * 305)));
    drawFrame(frameIndex);
  });

  return (
    <div className="relative w-full h-full bg-[#111]">
       <canvas ref={canvasRef} className="w-full h-full object-cover opacity-90" />
       {!imagesLoaded && (
         <div className="absolute inset-0 flex items-center justify-center text-white font-serif tracking-widest text-sm uppercase">
            Loading Experience...
         </div>
       )}
    </div>
  );
};
`;

content = content.replace('import { motion } from "framer-motion";', canvasSequenceCode);

const hooksCode = `
  // 1. Canvas Sequence Scroll hook
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: canvasProgress } = useScroll({
    target: canvasContainerRef,
    offset: ["start start", "end end"]
  });

  const handleTextareaChange
`;
content = content.replace('  const handleTextareaChange', hooksCode);

const jsxCode = `
      {/* 1. Canvas Sequence Section */}
      <div ref={canvasContainerRef} className="h-[400vh] w-full relative z-40 bg-[#111]">
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
           <CanvasSequence scrollProgress={canvasProgress} />
           
           <motion.div 
             className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-white/50"
           >
             <span className="text-[10px] md:text-xs uppercase tracking-widest mb-2 font-medium">Scroll</span>
             <div className="w-[1px] h-12 bg-white/20 overflow-hidden relative">
               <motion.div 
                 animate={{ y: [0, 48, 48], opacity: [0, 1, 0] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 className="w-full h-full bg-white absolute top-[-100%]"
               />
             </div>
           </motion.div>
        </div>
      </div>

      {/* 2. HERO & 3. MAIN INPUT */}
      <section className="px-6 pt-24 pb-16 md:pt-32 md:pb-24 max-w-4xl mx-auto text-center relative z-20 bg-[#FAF4EB]">
`;
content = content.replace('      {/* 2. HERO & 3. MAIN INPUT */}\n      <section className="px-6 pt-24 pb-16 md:pt-32 md:pb-24 max-w-4xl mx-auto text-center">', jsxCode);

fs.writeFileSync('frontend/src/app/page.tsx', content);
console.log('patched');
