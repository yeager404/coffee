import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

function CoffeeBean({ bean, smoothX, smoothY }) {
    // Translate the global mouse position based on this bean's parallax offset
    const x = useTransform(smoothX, v => v * bean.offset);
    const y = useTransform(smoothY, v => v * bean.offset);

    return (
        <motion.div
            className="absolute flex items-center justify-center drop-shadow-sm text-[#4a3525]/20"
            style={{
                left: `${bean.x}%`,
                x,
                y,
                fontSize: bean.size,
            }}
            initial={{
                top: `-${bean.size + 10}px`,
                rotate: bean.rotation
            }}
            animate={{
                top: `110%`,
                rotate: bean.rotation + (bean.rotationSpeed * 360)
            }}
            transition={{
                top: {
                    duration: bean.fallDuration,
                    repeat: Infinity,
                    ease: "linear",
                    delay: bean.delay
                },
                rotate: {
                    duration: bean.fallDuration,
                    repeat: Infinity,
                    ease: "linear",
                    delay: bean.delay
                }
            }}
        >
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.8 2.2c-4 1.1-6.6 5.8-5.3 10.5 1.1 3.9 4.7 6.4 8.7 6.4 2.2 0 4.3-.8 6-2.4 2.1-2 3.3-5 3-7.9-.5-4.4-4-7.8-8.5-8.1-1.3 0-2.6.5-3.9 1.5zM12.6 4.3c3 0 5.6 2.3 6 5.3.3 2.1-.6 4.3-2 5.5s-3.5 1.9-5.5 1.4c-2.3-.6-3.8-2.6-4.1-4.9-.3-1.8.4-3.5 1.6-4.7 1.1-1 2.5-1.6 4-2.6zm-1.8 1.4c-.9.9-1.5 2.2-1.2 3.5.3 1.5 1.5 2.7 3 3 1.3.3 2.6-.2 3.5-.9l-5.3-5.6z" />
            </svg>
        </motion.div>
    );
}

export default function BackgroundAnimation() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 50, stiffness: 150 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set((e.clientX / window.innerWidth) - 0.5);
            mouseY.set((e.clientY / window.innerHeight) - 0.5);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    const [beans, setBeans] = useState([]);
    useEffect(() => {
        const newBeans = Array.from({ length: 30 }).map(() => ({
            x: Math.random() * 100,
            size: 15 + Math.random() * 35,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() > 0.5 ? 1 : -1, // CW or CCW
            offset: (Math.random() - 0.5) * 80, // Parallax depth
            fallDuration: 60 + Math.random() * 60, // 60s to 120s to fall (SLOW PACE)
            delay: -Math.random() * 120 // Start at random points in the animation (increased delay range to match longer fall time)
        }));
        setBeans(newBeans);
    }, []);

    return (
        <div className="fixed inset-0 bg-[#f5f5f5] pointer-events-none -z-50 overflow-hidden">
            {beans.map((bean, i) => (
                <CoffeeBean key={i} bean={bean} smoothX={smoothX} smoothY={smoothY} />
            ))}
        </div>
    );
}
