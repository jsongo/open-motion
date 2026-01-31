import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { CompositionProvider } from './index';
export const Player = ({ component: Component, config, inputProps = {}, controls = true, autoPlay = false, loop = false, }) => {
    const [frame, setFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);
    const requestRef = useRef();
    const lastTimeRef = useRef();
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
                const s = Math.min(1, (parentWidth - 40) / config.width);
                if (s > 0)
                    setScale(s);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [config.width]);
    const animate = useCallback((time) => {
        if (lastTimeRef.current !== undefined) {
            const deltaTime = time - lastTimeRef.current;
            const frameStep = (deltaTime / 1000) * config.fps;
            setFrame((prevFrame) => {
                let nextFrame = prevFrame + frameStep;
                if (nextFrame >= config.durationInFrames) {
                    if (loop) {
                        nextFrame = 0;
                    }
                    else {
                        nextFrame = config.durationInFrames - 1;
                        setIsPlaying(false);
                    }
                }
                return nextFrame;
            });
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    }, [config.fps, config.durationInFrames, loop]);
    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = undefined;
            requestRef.current = requestAnimationFrame(animate);
        }
        else {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isPlaying, animate]);
    const togglePlay = () => setIsPlaying(!isPlaying);
    const handleSeek = (e) => {
        setFrame(Number(e.target.value));
        setIsPlaying(false);
    };
    return (_jsxs("div", { ref: containerRef, style: {
            display: 'inline-block',
            border: '1px solid #ccc',
            borderRadius: '4px',
            overflow: 'hidden',
            background: '#f0f0f0',
            width: config.width * scale,
        }, children: [_jsx("div", { style: {
                    width: config.width,
                    height: config.height,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    background: '#fff'
                }, children: _jsx(CompositionProvider, { config: config, frame: Math.floor(frame), inputProps: inputProps, children: _jsx(Component, {}) }) }), controls && (_jsxs("div", { style: { padding: '10px', background: '#f0f0f0', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 10 }, children: [_jsx("button", { onClick: togglePlay, children: isPlaying ? 'Pause' : 'Play' }), _jsx("input", { type: "range", min: "0", max: config.durationInFrames - 1, step: "1", value: Math.floor(frame), onChange: handleSeek, style: { flex: 1 } }), _jsxs("div", { style: { minWidth: '80px', fontSize: '12px', textAlign: 'right', color: '#000' }, children: [Math.floor(frame), " / ", config.durationInFrames] })] }))] }));
};
