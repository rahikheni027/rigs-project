import React, { useMemo, useState } from 'react';

/**
 * SCADA P&ID Process Flow -> Dependency-Aware Control System (Phase 4)
 * Renders an animated Directed Acyclic Graph (DAG) schematic of interconnected machines.
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
    MOTOR: ({ x, y, status, name, sc, hoverState, isCascadeTarget }) => (
        <g transform={`translate(${x},${y})`}>
            <rect x="-28" y="-18" width="56" height="36" rx="4" fill={`${sc}15`} stroke={sc} strokeWidth={hoverState ? "2.5" : "1.5"} />
            <line x1="28" y1="0" x2="44" y2="0" stroke={sc} strokeWidth="2" />
            <circle cx="0" cy="0" r="10" fill="none" stroke={sc} strokeWidth="1.5">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="2s" repeatCount="indefinite" />}
            </circle>
            <line x1="-6" y1="0" x2="6" y2="0" stroke={sc} strokeWidth="1" transform="rotate(45)">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="2s" repeatCount="indefinite" />}
            </line>
            <line x1="-6" y1="0" x2="6" y2="0" stroke={sc} strokeWidth="1" transform="rotate(-45)">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="2s" repeatCount="indefinite" />}
            </line>
            <text x="0" y="-24" textAnchor="middle" fill={sc} fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{name}</text>
            {isCascadeTarget && <text x="0" y="30" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">DEPENDENCY STOP</text>}
        </g>
    ),
    PUMP: ({ x, y, status, name, sc, hoverState, isCascadeTarget }) => (
        <g transform={`translate(${x},${y})`}>
            <circle cx="0" cy="0" r="18" fill={`${sc}15`} stroke={sc} strokeWidth={hoverState ? "2.5" : "1.5"} />
            <path d="M -8 -3 Q 0 -12 8 -3 Q 0 6 -8 -3 Z" fill={sc} opacity="0.5">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.5s" repeatCount="indefinite" />}
            </path>
            <line x1="-34" y1="0" x2="-18" y2="0" stroke={sc} strokeWidth="2" />
            <line x1="18" y1="0" x2="34" y2="0" stroke={sc} strokeWidth="2" />
            <text x="0" y="-24" textAnchor="middle" fill={sc} fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{name}</text>
            {isCascadeTarget && <text x="0" y="30" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">DEPENDENCY STOP</text>}
        </g>
    ),
    COMPRESSOR: ({ x, y, status, name, sc, hoverState, isCascadeTarget }) => (
        <g transform={`translate(${x},${y})`}>
            <polygon points="-22,-16 22,-16 16,16 -16,16" fill={`${sc}15`} stroke={sc} strokeWidth={hoverState ? "2.5" : "1.5"} />
            <circle cx="0" cy="0" r="8" fill="none" stroke={sc} strokeWidth="1">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1s" repeatCount="indefinite" />}
            </circle>
            <line x1="-5" y1="0" x2="5" y2="0" stroke={sc} strokeWidth="1">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1s" repeatCount="indefinite" />}
            </line>
            <text x="0" y="-22" textAnchor="middle" fill={sc} fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{name}</text>
            {isCascadeTarget && <text x="0" y="28" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">DEPENDENCY STOP</text>}
        </g>
    ),
    TURBINE: ({ x, y, status, name, sc, hoverState, isCascadeTarget }) => (
        <g transform={`translate(${x},${y})`}>
            <polygon points="0,-20 24,0 0,20 -24,0" fill={`${sc}15`} stroke={sc} strokeWidth={hoverState ? "2.5" : "1.5"} />
            <line x1="0" y1="-8" x2="0" y2="8" stroke={sc} strokeWidth="1.5">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.2s" repeatCount="indefinite" />}
            </line>
            <line x1="-8" y1="0" x2="8" y2="0" stroke={sc} strokeWidth="1.5">
                {status === 'RUNNING' && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.2s" repeatCount="indefinite" />}
            </line>
            <text x="0" y="-26" textAnchor="middle" fill={sc} fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{name}</text>
            {isCascadeTarget && <text x="0" y="32" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">DEPENDENCY STOP</text>}
        </g>
    ),
    GENERATOR: ({ x, y, status, name, sc, hoverState, isCascadeTarget }) => (
        <g transform={`translate(${x},${y})`}>
            <circle cx="0" cy="0" r="18" fill={`${sc}15`} stroke={sc} strokeWidth={hoverState ? "2.5" : "1.5"} />
            <text x="0" y="4" textAnchor="middle" fill={sc} fontSize="14" fontWeight="900" fontFamily="'JetBrains Mono', monospace">G</text>
            {status === 'RUNNING' && (
                <circle cx="0" cy="0" r="18" fill="none" stroke={sc} strokeWidth="0.5" opacity="0.4">
                    <animate attributeName="r" from="18" to="28" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
            )}
            <text x="0" y="-24" textAnchor="middle" fill={sc} fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{name}</text>
            {isCascadeTarget && <text x="0" y="32" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">DEPENDENCY STOP</text>}
        </g>
    ),
};

const DEFAULT_SHAPE = MACHINE_SHAPES.MOTOR;

const ProcessFlowDiagram = ({ nodes: incomingNodes = [], machines: incomingMachines = [], dependencyGraph = { nodes: [], edges: [] }, cascadingFailure = null }) => {
    const [hoveredNode, setHoveredNode] = useState(null);
    
    // Resolve which data source to use (backwards compatibility with multiple dashboards)
    const activeMachines = incomingMachines.length > 0 ? incomingMachines : (incomingNodes.length > 0 ? incomingNodes : []);

    // Filter dependency graph edges for only existing nodes (defense against stale data)
    let machineMap = new Map();
    activeMachines.forEach(m => machineMap.set(m.machineId, m));

    // Fallback: if no dependency graph provided/exists, build a simple linear one based on array order
    const edges = useMemo(() => {
        if (dependencyGraph.edges && dependencyGraph.edges.length > 0) {
            return dependencyGraph.edges;
        }
        // Fallback linear layout
        return activeMachines.slice(0, -1).map((m, i) => ({
            id: `fb-${i}`,
            source: activeMachines[i].machineId,
            target: activeMachines[i + 1].machineId,
            type: 'PROCESS_FLOW',
            propagateStop: true
        }));
    }, [dependencyGraph.edges, activeMachines.length]); // Only recalc fallback if count changes

    const { nodes: layoutNodes, edges: layoutEdges, width, height } = useMemo(() => {
        const count = activeMachines.length || 1;
        if (count === 0) return { nodes: [], edges: [], width: 900, height: 280 };

        const nodeMap = new Map(activeMachines.map(m => [m.machineId, { ...m, inDegree: 0, outDegree: 0, layer: 0 }]));
        
        // Calculate in-degrees
        edges.forEach(e => {
            if (nodeMap.has(e.target) && nodeMap.has(e.source)) {
                nodeMap.get(e.target).inDegree++;
                nodeMap.get(e.source).outDegree++;
            }
        });

        // Layer assign (BFS Topological Sort Kahn's Algo)
        let queue = Array.from(nodeMap.values()).filter(n => n.inDegree === 0);
        let layer = 0;
        const layered = [];

        while (queue.length > 0) {
            let nextQueue = [];
            layered[layer] = [];
            for (let u of queue) {
                u.layer = layer;
                layered[layer].push(u);
                edges.filter(e => e.source === u.machineId).forEach(e => {
                    if (nodeMap.has(e.target)) {
                        const v = nodeMap.get(e.target);
                        v.inDegree--;
                        if (v.inDegree === 0) nextQueue.push(v);
                    }
                });
            }
            layer++;
            queue = nextQueue;
        }
        
        // Assign unvisited nodes (cycles) to arbitrary max layer
        Array.from(nodeMap.values()).filter(n => n.inDegree > 0).forEach(n => {
            if (!layered[layer]) layered[layer] = [];
            layered[layer].push(n);
        });

        // Compute XY coordinates
        const LAYER_X_SPACING = 160;
        const NODE_Y_SPACING = 80;
        const reqWidth = Math.max(900, (layered.length + 1) * LAYER_X_SPACING);
        
        const maxNodesInLayer = Math.max(...layered.map(l => l.length));
        const reqHeight = Math.max(280, maxNodesInLayer * NODE_Y_SPACING + 100);

        layered.forEach((lNodes, lIdx) => {
            const x = 80 + lIdx * LAYER_X_SPACING;
            const yOffset = (reqHeight - (lNodes.length * NODE_Y_SPACING)) / 2 + 40;
            lNodes.forEach((node, nIdx) => {
                node.x = x;
                node.y = yOffset + nIdx * NODE_Y_SPACING;
            });
        });

        return { nodes: Array.from(nodeMap.values()), edges, width: reqWidth, height: reqHeight };
    }, [activeMachines.length, edges]); // CRITICAL: Static layout based on machine count/edges structure, not individual telemetry updates

    const nodePositions = new Map(layoutNodes.map(n => [n.machineId, { x: n.x, y: n.y }]));

    // Path calculation
    const generatePath = (sourcePos, targetPos) => {
        if (!sourcePos || !targetPos) return "";
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        
        // Cubic bezier to make nice curved pipes
        return `M ${sourcePos.x + 30},${sourcePos.y} 
                C ${sourcePos.x + 30 + dx / 2},${sourcePos.y} 
                  ${targetPos.x - 30 - dx / 2},${targetPos.y} 
                  ${targetPos.x - 30},${targetPos.y}`;
    };

    // Calculate upstream/downstream highlights when hovering
    const highlightedEdges = useMemo(() => {
        if (!hoveredNode) return new Set();
        
        // Find downstream using BFS
        const downEdges = new Set();
        let queue = [hoveredNode];
        const visited = new Set();
        
        while(queue.length > 0) {
            let curr = queue.shift();
            visited.add(curr);
            layoutEdges.forEach(e => {
                if (e.source === curr) {
                    downEdges.add(e.id || `${e.source}-${e.target}`);
                    if (!visited.has(e.target)) queue.push(e.target);
                }
            });
        }
        
        // Find upstream using BFS
        const upEdges = new Set();
        queue = [hoveredNode];
        visited.clear();
        
        while(queue.length > 0) {
            let curr = queue.shift();
            visited.add(curr);
            layoutEdges.forEach(e => {
                if (e.target === curr) {
                    upEdges.add(e.id || `${e.source}-${e.target}`);
                    if (!visited.has(e.source)) queue.push(e.source);
                }
            });
        }
        
        return { up: upEdges, down: downEdges };
    }, [hoveredNode, layoutEdges]);

    if (activeMachines.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                NO MACHINES REGISTERED — WAITING FOR TELEMETRY DATA
            </div>
        );
    }

    return (
        <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(14,165,233,0.3) transparent' }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', minWidth: width }}>
                <defs>
                    <marker id="flowArrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                        <path d="M0,0 L6,2 L0,4" fill="#0ea5e9" opacity="0.4" />
                    </marker>
                    <marker id="dangerArrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                        <path d="M0,0 L6,2 L0,4" fill="#ef4444" opacity="0.6" />
                    </marker>
                    <filter id="cascadeGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feFlood floodColor="#ef4444" floodOpacity="0.4" result="color" />
                        <feComposite in="color" in2="blur" operator="in" result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="hoverGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feFlood floodColor="#38bdf8" floodOpacity="0.5" result="color" />
                        <feComposite in="color" in2="blur" operator="in" result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <pattern id="pidGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(14,165,233,0.04)" strokeWidth="0.5" />
                    <line x1="0" y1="0" x2="20" y2="0" stroke="rgba(14,165,233,0.04)" strokeWidth="0.5" />
                </pattern>
                <rect width={width} height={height} fill="url(#pidGrid)" rx="8" />

                <text x="12" y="18" fill="#64748b" fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">P&ID — DEPENDENCY GRAPH</text>

                {cascadingFailure && (
                    <g>
                        <rect x="0" y="0" width={width} height={height} fill="rgba(239,68,68,0.03)" rx="8">
                            <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2s" repeatCount="indefinite" />
                        </rect>
                        <text x={width / 2} y="18" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="800" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.15em">
                            ⚠ CASCADING FAILURE — {cascadingFailure.processUnit || 'DEPENDENCY IMPACT'}
                            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                        </text>
                    </g>
                )}

                {/* Draw Edges */}
                {layoutEdges.map((e, i) => {
                    const srcNode = machineMap.get(e.source);
                    const tgtNode = machineMap.get(e.target);
                    if (!srcNode || !tgtNode) return null;

                    const srcPos = nodePositions.get(e.source);
                    const tgtPos = nodePositions.get(e.target);
                    const edgeId = e.id || `${e.source}-${e.target}`;

                    const isRunning = srcNode.status === 'RUNNING' && tgtNode.status === 'RUNNING';
                    const isSrcFail = srcNode.status === 'EMERGENCY' || srcNode.status === 'STOPPED';
                    // Has stopped dependency reason or is actively being cascaded over
                    const isTgtFailCascade = (tgtNode.stoppedByDependency === srcNode.name) || (isSrcFail && tgtNode.status !== 'RUNNING' && e.propagateStop);
                    
                    const isHoverDown = hoveredNode && highlightedEdges.down.has(edgeId);
                    const isHoverUp = hoveredNode && highlightedEdges.up.has(edgeId);
                    
                    let edgeColor = '#1e293b';
                    let sw = 2;
                    let opacity = 0.2;
                    let marker = undefined;
                    
                    if (isHoverDown) { edgeColor = '#f43f5e'; opacity = 0.8; sw = 3; }
                    else if (isHoverUp) { edgeColor = '#38bdf8'; opacity = 0.8; sw = 3; }
                    else if (isTgtFailCascade) { edgeColor = '#ef4444'; opacity = 0.7; sw = 3; marker = 'url(#dangerArrow)'; }
                    else if (isRunning) { edgeColor = '#0ea5e9'; opacity = 0.6; marker = 'url(#flowArrow)'; }

                    const pathDef = generatePath(srcPos, tgtPos);

                    return (
                        <g key={`edge-${edgeId}`}>
                            <path 
                                d={pathDef} 
                                fill="none" 
                                stroke={edgeColor} 
                                strokeWidth={sw} 
                                opacity={opacity} 
                                markerEnd={marker}
                                style={{ transition: 'all 0.3s ease' }}
                            >
                                {isTgtFailCascade && <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1s" repeatCount="indefinite" />}
                            </path>

                            {isRunning && !isHoverDown && !isTgtFailCascade && (
                                <circle r="2" fill="#38bdf8" opacity="0.8">
                                    <animateMotion dur={`${1.5 + Math.random() * 1}s`} repeatCount="indefinite" path={pathDef} />
                                </circle>
                            )}

                            {isTgtFailCascade && (
                                <circle r="2.5" fill="#ef4444" opacity="0.9">
                                    <animateMotion dur="1s" repeatCount="indefinite" path={pathDef} />
                                </circle>
                            )}
                        </g>
                    );
                })}

                {/* Draw Nodes */}
                {layoutNodes.map((m) => {
                    const mType = m.machineType || 'MOTOR';
                    const ShapeComponent = MACHINE_SHAPES[mType] || DEFAULT_SHAPE;
                    const sc = STATUS_COLORS[m.status] || STATUS_COLORS.OFFLINE;
                    const isHovered = hoveredNode === m.machineId;
                    const isCascadeTarget = m.stoppedByDependency != null || (m.status === 'STOPPED' && m.upstreamDependencies?.some(depId => machineMap.get(depId)?.status === 'STOPPED' || machineMap.get(depId)?.status === 'EMERGENCY'));

                    return (
                        <g 
                            key={`node-${m.machineId}`} 
                            filter={isHovered ? 'url(#hoverGlow)' : (isCascadeTarget ? 'url(#cascadeGlow)' : undefined)}
                            onMouseEnter={() => setHoveredNode(m.machineId)}
                            onMouseLeave={() => setHoveredNode(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            <ShapeComponent
                                x={m.x}
                                y={m.y}
                                status={m.status}
                                name={m.machineName?.replace(/\s+/g, ' ').substring(0, 14) || `M${m.machineId}`}
                                sc={sc}
                                hoverState={isHovered}
                                isCascadeTarget={isCascadeTarget}
                            />
                            
                            {/* Badges for dependencies */}
                            {m.upstreamDependencies?.length > 0 && (
                                <g transform={`translate(${m.x - 20}, ${m.y - 30})`}>
                                    <rect x="-6" y="-6" width="12" height="12" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1"/>
                                    <text x="0" y="3" textAnchor="middle" fill="#38bdf8" fontSize="6" fontFamily="'JetBrains Mono'">{m.upstreamDependencies.length}</text>
                                </g>
                            )}
                            {m.downstreamDependencies?.length > 0 && (
                                <g transform={`translate(${m.x + 20}, ${m.y - 30})`}>
                                    <rect x="-6" y="-6" width="12" height="12" rx="6" fill="#1e293b" stroke="#f43f5e" strokeWidth="1"/>
                                    <text x="0" y="3" textAnchor="middle" fill="#f43f5e" fontSize="6" fontFamily="'JetBrains Mono'">{m.downstreamDependencies.length}</text>
                                </g>
                            )}

                            {/* Status circle */}
                            <circle cx={m.x + 22} cy={m.y - 18} r="3" fill={sc}>
                                {m.status === 'RUNNING' && <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />}
                                {(m.status === 'EMERGENCY' || isCascadeTarget) && <animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" />}
                            </circle>
                            {m.status !== 'RUNNING' && m.status !== 'OFFLINE' && (
                                <text x={m.x + 22} y={m.y - 8} textAnchor="middle" fill={sc} fontSize="6" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{m.status}</text>
                            )}
                        </g>
                    );
                })}

                <g transform={`translate(12, ${height - 12})`}>
                    {Object.entries({ RUNNING: '#22c55e', STOPPED: '#64748b', EMERGENCY: '#ef4444', MAINT: '#f59e0b', CAL: '#3b82f6' }).map(([label, color], i) => (
                        <g key={label} transform={`translate(${i * 70}, 0)`}>
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
