import { createContext, useContext } from 'react';

// Provides a callback that BrainNode calls when a long-press is detected on mobile.
// App.jsx supplies the handler; BrainNode consumes it via useNodeInteraction().
export const NodeInteractionContext = createContext((_nodeId) => {});

export const useNodeInteraction = () => useContext(NodeInteractionContext);
