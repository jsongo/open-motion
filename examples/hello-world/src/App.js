import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { CompositionProvider, useCurrentFrame, useAbsoluteFrame, useVideoConfig, getInputProps, interpolate, spring, Sequence, Player, delayRender, continueRender, Composition } from '@open-motion/core';
// A simple Lottie component using lottie-web from CDN
const Lottie = ({ url }) => {
    const containerRef = useRef(null);
    const animationRef = useRef(null);
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    useEffect(() => {
        const handle = delayRender('Loading Lottie animation');
        // Load lottie-web dynamically if not present
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
        script.onload = () => {
            if (containerRef.current) {
                animationRef.current = window.lottie.loadAnimation({
                    container: containerRef.current,
                    renderer: 'svg',
                    loop: false,
                    autoplay: false,
                    path: url,
                });
                animationRef.current.addEventListener('DOMLoaded', () => {
                    continueRender(handle);
                });
            }
        };
        document.head.appendChild(script);
        return () => {
            if (animationRef.current) {
                animationRef.current.destroy();
            }
        };
    }, [url]);
    useEffect(() => {
        if (animationRef.current) {
            // Manually set frame to ensure synchronization
            // lottie-web uses frames, so we can go directly
            animationRef.current.goToAndStop(frame, true);
        }
    }, [frame]);
    return _jsx("div", { ref: containerRef, style: { width: '100%', height: '100%' } });
};
const HelloWorldVideo = () => {
    const frame = useCurrentFrame();
    const absoluteFrame = useAbsoluteFrame();
    const { width, height, fps } = useVideoConfig();
    const { title = 'OpenMotion' } = getInputProps();
    const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
    const scale = spring({
        frame: frame - 10,
        fps,
        config: { stiffness: 100 }
    });
    return (_jsxs("div", { style: {
            flex: 1,
            backgroundColor: 'white',
            width,
            height,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 80,
            fontWeight: 'bold',
            fontFamily: 'sans-serif'
        }, children: [_jsxs("div", { style: { opacity, transform: `scale(${scale})` }, children: ["Hello ", _jsx("span", { style: { color: '#00aaff' }, children: title })] }), _jsx("div", { style: { position: 'absolute', top: 50, right: 50, width: 300, height: 300 }, children: _jsx(Lottie, { url: "https://assets10.lottiefiles.com/packages/lf20_m6cuL6.json" }) }), _jsx(Sequence, { from: 40, durationInFrames: 30, children: _jsxs("div", { style: { position: 'absolute', bottom: 100, fontSize: 40, textAlign: 'center' }, children: [_jsxs("div", { children: ["Current Frame: ", frame] }), _jsxs("div", { style: { fontSize: 20, color: '#888' }, children: ["Absolute Frame: ", absoluteFrame] })] }) })] }));
};
export const App = () => {
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        const handle = delayRender('Mock initial loading');
        setTimeout(() => {
            setIsReady(true);
            continueRender(handle);
        }, 1000);
    }, []);
    // Check if we are in rendering mode (provided by renderer)
    const isRendering = typeof window.__OPEN_MOTION_FRAME__ === 'number';
    if (!isReady && !isRendering) {
        return _jsx("div", { children: "Loading resources..." });
    }
    const config = {
        width: 1280,
        height: 720,
        fps: 30,
        durationInFrames: 90
    };
    if (isRendering) {
        const compositionId = window.__OPEN_MOTION_COMPOSITION_ID__ || 'hello-world';
        const inputProps = window.__OPEN_MOTION_INPUT_PROPS__ || {};
        // In a real implementation, we would look up the config by ID
        // For this example, we just use the default
        return (_jsx(CompositionProvider, { config: config, frame: window.__OPEN_MOTION_FRAME__, inputProps: inputProps, children: _jsx(HelloWorldVideo, {}) }));
    }
    return (_jsxs("div", { style: { padding: '20px' }, children: [_jsx("h1", { children: "OpenMotion Player Preview" }), _jsx(Player, { component: HelloWorldVideo, config: config, inputProps: { title: 'Claude Preview' }, loop: true }), _jsx("div", { style: { display: 'none' }, children: _jsx(Composition, { id: "hello-world", component: HelloWorldVideo, width: 1280, height: 720, fps: 30, durationInFrames: 90 }) })] }));
};
