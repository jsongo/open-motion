import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { CompositionProvider } from './index';
export const Player = ({ component: Component, config, inputProps = {}, controls = true, autoPlay = false, loop = false, }) => {
    const [frame, setFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const requestRef = useRef();
    const lastTimeRef = useRef();
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
    return (_jsxs("div", { style: { display: 'inline-block', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }, children: [_jsx("div", { style: {
                    width: config.width,
                    height: config.height,
                    position: 'relative',
                    background: '#000',
                    overflow: 'hidden'
                }, children: _jsx(CompositionProvider, { config: config, frame: Math.floor(frame), inputProps: inputProps, children: _jsx(Component, {}) }) }), controls && (_jsxs("div", { style: { padding: '10px', background: '#f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx("button", { onClick: togglePlay, children: isPlaying ? 'Pause' : 'Play' }), _jsx("input", { type: "range", min: "0", max: config.durationInFrames - 1, step: "1", value: Math.floor(frame), onChange: handleSeek, style: { flex: 1 } }), _jsxs("div", { style: { minWidth: '80px', fontSize: '12px', textAlign: 'right' }, children: [Math.floor(frame), " / ", config.durationInFrames] })] }))] }));
};
