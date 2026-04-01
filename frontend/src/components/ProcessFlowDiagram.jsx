import React, { useMemo } from 'react';

/**
 * SCADA P&ID (Piping & Instrumentation Diagram) Process Flow
 * Renders an animated schematic of interconnected industrial machines.
 */

const STATUS_COLORS = {
    RUNNING: '#22c55e',
    STOPPED: '#64748b',
    EMERGENCY: '#ef4444',
    MAINTENANCE: '#f59e0b',
    CALIBRATING: '#3b82f6',
    OFFLINE: '#475569',
};

const MACHINE_SHAPES = {
    MOTOR: ({ x, y, status, name, temp, rpm, sc }) => (
        <g transform={`translate(${x},${y})`}>
            {/* Motor body */}
            <rect x="-28" y="-18" width="56" height="36" rx="4" fill={`${sc}15`} stroke={sc} strokeWidth="1.5" />
            {/* Shaft */}
            <line x1="28" y1="0" x2="44" y2="0" stroke={sc} strokeWidth="2" />
            {/* Rotor symbol */}
            <circle cx="0" cy="0" r="10" fill="none" stroke={sc} strokeWidth="1.5">
                {status === 'RUNNING' && (
                    <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="2s" repeatCount="indefinite" />
                )}
            </circle>
            <line x1="-6" y1="0" x2="6" y2="0" stroke={sc} strokeWidth="1" transform="rotate(45)">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="2s" repeatCount="indefinite" />}
            </line>
            <line x1="-6" y1="0" x2="6" y2="0" stroke={sc} strokeWidth="1" transform="rotate(-45)">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="2s" repeatCount="indefinite" />}
            </line>
            {/* Label */}
            <text x="0" y="-24" textAnchor="middle" fill={sc} fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{name}</text>
            <text x="0" y="30" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono', monospace">{temp != null ? `${temp.toFixed(0)}°C` : '--'} | {rpm != null ? `${rpm.toFixed(0)}rpm` : '--'}</text>
        </g>
    ),
    PUMP: ({ x, y, status, name, temp, rpm, sc }) => (
        <g transform={`translate(${x},${y})`}>
            {/* Pump body — circle with arrow */}
            <circle cx="0" cy="0" r="18" fill={`${sc}15`} stroke={sc} strokeWidth="1.5" />
            {/* Impeller */}
            <path d="M -8 -3 Q 0 -12 8 -3 Q 0 6 -8 -3 Z" fill={sc} opacity="0.5">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.5s" repeatCount="indefinite" />}
            </path>
            {/* Inlet/Outlet pipes */}
            <line x1="-34" y1="0" x2="-18" y2="0" stroke={sc} strokeWidth="2" />
            <line x1="18" y1="0" x2="34" y2="0" stroke={sc} strokeWidth="2" />
            <text x="0" y="-24" textAnchor="middle" fill={sc} fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{name}</text>
            <text x="0" y="30" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono', monospace">{temp != null ? `${temp.toFixed(0)}°C` : '--'}</text>
        </g>
    ),
    COMPRESSOR: ({ x, y, status, name, temp, rpm, sc }) => (
        <g transform={`translate(${x},${y})`}>
            {/* Compressor — trapezoid shape */}
            <polygon points="-22,-16 22,-16 16,16 -16,16" fill={`${sc}15`} stroke={sc} strokeWidth="1.5" />
            {/* Internal fan */}
            <circle cx="0" cy="0" r="8" fill="none" stroke={sc} strokeWidth="1">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1s" repeatCount="indefinite" />}
            </circle>
            <line x1="-5" y1="0" x2="5" y2="0" stroke={sc} strokeWidth="1">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1s" repeatCount="indefinite" />}
            </line>
            <text x="0" y="-22" textAnchor="middle" fill={sc} fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{name}</text>
            <text x="0" y="28" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono', monospace">{temp != null ? `${temp.toFixed(0)}°C` : '--'}</text>
        </g>
    ),
    TURBINE: ({ x, y, status, name, temp, rpm, sc }) => (
        <g transform={`translate(${x},${y})`}>
            {/* Turbine — diamond */}
            <polygon points="0,-20 24,0 0,20 -24,0" fill={`${sc}15`} stroke={sc} strokeWidth="1.5" />
            {/* Blade indicator */}
            <line x1="0" y1="-8" x2="0" y2="8" stroke={sc} strokeWidth="1.5">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.2s" repeatCount="indefinite" />}
            </line>
            <line x1="-8" y1="0" x2="8" y2="0" stroke={sc} strokeWidth="1.5">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.2s" repeatCount="indefinite" />}
            </line>
            <text x="0" y="-26" textAnchor="middle" fill={sc} fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{name}</text>
            <text x="0" y="32" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono', monospace">{rpm != null ? `${rpm.toFixed(0)}rpm` : '--'}</text>
        </g>
    ),
    GENERATOR: ({ x, y, status, name, temp, rpm, sc }) => (
        <g transform={`translate(${x},${y})`}>
            {/* Generator — circle with G */}
            <circle cx="0" cy="0" r="18" fill={`${sc}15`} stroke={sc} strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill={sc} fontSize="14" fontWeight="900" fontFamily="'JetBrains Mono', monospace">G</text>
            {/* Pulse ring for running status */}
            {status === 'RUNNING' && (
                <circle cx="0" cy="0" r="18" fill="none" stroke={sc} strokeWidth="0.5" opacity="0.4">
                    <animate attributeName="r" from="18" to="28" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
            )}
            <text x="0" y="-24" textAnchor="middle" fill={sc} fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{name}</text>
            <text x="0" y="32" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono', monospace">{temp != null ? `${temp.toFixed(0)}°C` : '--'}</text>
        </g>
    ),
};

const DEFAULT_SHAPE = MACHINE_SHAPES.MOTOR;

const ProcessFlowDiagram = ({ machines = [] }) => {
    const width = Math.max(900, machines.length * 120);
    const height = 280;

    const positions = useMemo(() => {
        const count = machines.length || 1;
        const spacing = (width - 120) / Math.max(count - 1, 1);
        return machines.map((_, i) => ({
            x: 60 + i * spacing,
            y: height / 2,
        }));
    }, [machines.length, width, height]);

    if (machines.length === 0) {
        return (
            <div style={{
                textAlign: 'center', padding: '40px 0', color: '#475569',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            }}>
                NO MACHINES REGISTERED — WAITING FOR TELEMETRY DATA
            </div>
        );
    }

    return (
        <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(14,165,233,0.3) transparent' }}>
            <svg width={width} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', minWidth: width }}>
                <defs>
                {/* Animated flow particles along pipes */}
                <marker id="flowArrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                    <path d="M0,0 L6,2 L0,4" fill="#0ea5e9" opacity="0.4" />
                </marker>
                {/* Flow particle */}
                <circle id="flowDot" r="2" fill="#0ea5e9" opacity="0.6" />
            </defs>

            {/* Background grid */}
            <pattern id="pidGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(14,165,233,0.04)" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="20" y2="0" stroke="rgba(14,165,233,0.04)" strokeWidth="0.5" />
            </pattern>
            <rect width={width} height={height} fill="url(#pidGrid)" rx="8" />

            {/* Header section */}
            <text x="12" y="18" fill="#64748b" fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">P&ID — PROCESS FLOW</text>

            {/* Main supply line (horizontal bus) */}
            <line x1="30" y1={height / 2} x2={width - 30} y2={height / 2} stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 3" opacity="0.2" />

            {/* Animated flow particles along the supply line */}
            {machines.some(m => m.status === 'RUNNING') && (
                <>
                    <circle r="2.5" fill="#0ea5e9" opacity="0.5">
                        <animateMotion dur="4s" repeatCount="indefinite" path={`M 30,${height / 2} L ${width - 30},${height / 2}`} />
                    </circle>
                    <circle r="2" fill="#38bdf8" opacity="0.3">
                        <animateMotion dur="4s" repeatCount="indefinite" path={`M 30,${height / 2} L ${width - 30},${height / 2}`} begin="2s" />
                    </circle>
                </>
            )}

            {/* Connecting pipes between machines */}
            {positions.map((pos, i) => {
                if (i < positions.length - 1) {
                    const nextPos = positions[i + 1];
                    const m1 = machines[i];
                    const m2 = machines[i + 1];
                    const pipeColor = (m1.status === 'RUNNING' && m2.status === 'RUNNING') ? '#0ea5e9' : '#1e293b';
                    const isActive = m1.status === 'RUNNING' && m2.status === 'RUNNING';

                    return (
                        <g key={`pipe-${i}`}>
                            <line
                                x1={pos.x + 40} y1={pos.y}
                                x2={nextPos.x - 40} y2={nextPos.y}
                                stroke={pipeColor} strokeWidth="2" markerEnd="url(#flowArrow)"
                                opacity={isActive ? 0.6 : 0.15}
                            />
                            {/* Flow dot */}
                            {isActive && (
                                <circle r="2" fill="#38bdf8" opacity="0.8">
                                    <animateMotion
                                        dur="2s" repeatCount="indefinite"
                                        path={`M ${pos.x + 40},${pos.y} L ${nextPos.x - 40},${nextPos.y}`}
                                    />
                                </circle>
                            )}
                        </g>
                    );
                }
                return null;
            })}

            {/* Input valve */}
            <g transform={`translate(20,${height / 2})`}>
                <polygon points="-6,-8 6,-8 0,0" fill="#0ea5e9" opacity="0.3" />
                <polygon points="-6,8 6,8 0,0" fill="#0ea5e9" opacity="0.3" />
                <text x="0" y="20" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="'JetBrains Mono', monospace">SUPPLY</text>
            </g>

            {/* Output valve */}
            <g transform={`translate(${width - 20},${height / 2})`}>
                <polygon points="-6,-8 6,-8 0,0" fill="#0ea5e9" opacity="0.3" />
                <polygon points="-6,8 6,8 0,0" fill="#0ea5e9" opacity="0.3" />
                <text x="0" y="20" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="'JetBrains Mono', monospace">OUTPUT</text>
            </g>

            {/* Machines */}
            {machines.map((m, i) => {
                const pos = positions[i];
                const mType = m.machineType || 'MOTOR';
                const ShapeComponent = MACHINE_SHAPES[mType] || DEFAULT_SHAPE;
                const sc = STATUS_COLORS[m.status] || STATUS_COLORS.OFFLINE;

                return (
                    <ShapeComponent
                        key={m.machineId}
                        x={pos.x}
                        y={pos.y}
                        status={m.status}
                        name={m.machineName?.replace(/\s+/g, ' ').substring(0, 14) || `M${i + 1}`}
                        temp={m.temperature}
                        rpm={m.rpm}
                        sc={sc}
                    />
                );
            })}

            {/* Status indicators */}
            {machines.map((m, i) => {
                const pos = positions[i];
                const sc = STATUS_COLORS[m.status] || STATUS_COLORS.OFFLINE;
                return (
                    <g key={`statusInd-${i}`} transform={`translate(${pos.x + 22},${pos.y - 18})`}>
                        <circle r="3" fill={sc}>
                            {m.status === 'RUNNING' && <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />}
                            {m.status === 'EMERGENCY' && <animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" />}
                        </circle>
                    </g>
                );
            })}

            {/* Footer — legend */}
            <g transform={`translate(12, ${height - 12})`}>
                {Object.entries({ RUNNING: '#22c55e', STOPPED: '#64748b', EMERGENCY: '#ef4444', MAINT: '#f59e0b' }).map(([label, color], i) => (
                    <g key={label} transform={`translate(${i * 75}, 0)`}>
                        <circle r="3" fill={color} cy="0" cx="3" />
                        <text x="10" y="3" fill="#475569" fontSize="7" fontFamily="'JetBrains Mono', monospace">{label}</text>
                    </g>
                ))}
            </g>
        </svg>
        </div>
    );
};

export default ProcessFlowDiagram;
