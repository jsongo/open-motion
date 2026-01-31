import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { CompositionProvider, useCurrentFrame, useVideoConfig, getInputProps, interpolate, spring, Sequence, Player, delayRender, continueRender, Composition } from '@open-motion/core';
import { Rocket, Star, Heart, Cloud, Sun } from 'lucide-react';
// --- Components ---
const FloatingIcon = ({ Icon, color, delay }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const y = interpolate(frame, [0, 60], [10, -10], { extrapolateRight: 'clamp' });
    const opacity = interpolate(frame - delay, [0, 20], [0, 1]);
    const scale = spring({
        frame: frame - delay,
        fps,
        config: { stiffness: 100 }
    });
    return (_jsx("div", { style: {
            opacity,
            transform: `translateY(${y}px) scale(${scale})`,
            color,
            margin: '0 20px'
        }, children: _jsx(Icon, { size: 64 }) }));
};
const AsyncImage = ({ src }) => {
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        const handle = delayRender(`Loading image: ${src}`);
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setLoaded(true);
            continueRender(handle);
        };
    }, [src]);
    if (!loaded)
        return null;
    return (_jsx("img", { src: src, style: {
            width: '400px',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        } }));
};
// --- Main Demo Video ---
const DemoVideo = () => {
    const frame = useCurrentFrame();
    const { width, height, fps } = useVideoConfig();
    console.debug('OpenMotion: DemoVideo rendering at frame', frame);
    const { title = 'OpenMotion Demo', backgroundColor = '#ffffff' } = getInputProps();
    return (_jsxs("div", { style: {
            flex: 1,
            backgroundColor: backgroundColor,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'system-ui, sans-serif',
            opacity: 1,
            position: 'relative',
            overflow: 'hidden'
        }, children: [_jsx(Sequence, { from: 0, durationInFrames: 60, children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1, position: 'relative', zIndex: 10 }, children: [_jsx("h1", { style: {
                                fontSize: 80,
                                margin: 0,
                                color: '#1a1a1a',
                                opacity: 1,
                                transform: `translateY(${interpolate(frame, [0, 30], [50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
                            }, children: title }), _jsxs("div", { style: { display: 'flex', marginTop: 20 }, children: [_jsx(FloatingIcon, { Icon: Rocket, color: "#3b82f6", delay: 10 }), _jsx(FloatingIcon, { Icon: Star, color: "#eab308", delay: 20 })] })] }) }), _jsx(Sequence, { from: 60, durationInFrames: 60, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center' }, children: [_jsx(FloatingIcon, { Icon: Heart, color: "#ef4444", delay: 0 }), _jsx("div", { style: { fontSize: 40, fontWeight: 'bold' }, children: "Physics-based Springs" }), _jsx(FloatingIcon, { Icon: Cloud, color: "#60a5fa", delay: 15 })] }) }), _jsx(Sequence, { from: 120, durationInFrames: 90, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 40, marginBottom: 20 }, children: "Remote Assets (Async)" }), _jsx(AsyncImage, { src: "https://picsum.photos/800/450" })] }) }), _jsx(Sequence, { from: 210, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx(Sun, { size: 100, color: "#f59e0b", style: {
                                transform: `rotate(${frame * 2}deg) scale(${spring({ frame: frame - 210, fps })})`
                            } }), _jsx("div", { style: { fontSize: 60, marginTop: 20 }, children: "Built with OpenMotion" })] }) })] }));
};
// --- App Wrapper ---
export const App = () => {
    const config = {
        width: 1280,
        height: 720,
        fps: 30,
        durationInFrames: 300
    };
    const isRendering = typeof window.__OPEN_MOTION_FRAME__ === 'number';
    if (isRendering) {
        const inputProps = window.__OPEN_MOTION_INPUT_PROPS__ || {};
        return (_jsx(CompositionProvider, { config: config, frame: window.__OPEN_MOTION_FRAME__, inputProps: inputProps, children: _jsx(DemoVideo, {}) }));
    }
    return (_jsxs("div", { style: { padding: '20px' }, children: [_jsx("h1", { children: "OpenMotion Full Demo" }), _jsx(Player, { component: DemoVideo, config: config, inputProps: { title: 'The Future of Video', backgroundColor: '#e0f2fe' }, loop: true }), _jsx("div", { style: { display: 'none' }, children: _jsx(Composition, { id: "main", component: DemoVideo, ...config }) })] }));
};
