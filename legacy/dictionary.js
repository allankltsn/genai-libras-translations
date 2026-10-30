// Dicionário de Keyframes otimizado com enquadramento Half-Body (Cintura para cima)
// e eixos corrigidos para braços à frente do corpo.

export const LIBRAS_DICTIONARY = {
    "NEUTRAL": {
        duration: 1000,
        keyframes: [
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    RightHand: { x: 0, y: 0, z: 0 },
                    LeftArm: { x: 0.1, y: -0.1, z: 0.1 },
                    LeftForeArm: { x: -0.2, y: 0, z: 0 },
                    LeftHand: { x: 0, y: 0, z: 0 },
                    Neck: { x: 0, y: 0, z: 0 },
                    Head: { x: 0, y: 0, z: 0 },
                    Spine1: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "SINAL_LETRA_L": {
        duration: 1800,
        keyframes: [
            {
                time: 0.35,
                pose: {
                    RightArm: { x: -0.6, y: -0.3, z: 0.4 },
                    RightForeArm: { x: -1.3, y: -0.2, z: 0 },
                    RightHand: { x: -0.2, y: 0.3, z: 0 },
                    RightHandThumb1: { x: -0.6, y: 0, z: 0 },
                    RightHandIndex1: { x: 0.0, y: 0, z: 0 },
                    RightHandMiddle1: { x: 1.4, y: 0, z: 0 },
                    RightHandRing1: { x: 1.4, y: 0, z: 0 },
                    RightHandPinky1: { x: 1.4, y: 0, z: 0 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    RightHandThumb1: { x: 0, y: 0, z: 0 },
                    RightHandMiddle1: { x: 0, y: 0, z: 0 },
                    RightHandRing1: { x: 0, y: 0, z: 0 },
                    RightHandPinky1: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "SINAL_LETRA_Y": {
        duration: 1800,
        keyframes: [
            {
                time: 0.4,
                pose: {
                    RightArm: { x: -0.5, y: -0.4, z: 0.5 },
                    RightForeArm: { x: -1.4, y: -0.1, z: 0 },
                    RightHandThumb1: { x: -0.8, y: 0, z: 0 },
                    RightHandPinky1: { x: 0.0, y: 0, z: 0 },
                    RightHandIndex1: { x: 1.4, y: 0, z: 0 },
                    RightHandMiddle1: { x: 1.4, y: 0, z: 0 },
                    RightHandRing1: { x: 1.4, y: 0, z: 0 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    RightHandThumb1: { x: 0, y: 0, z: 0 },
                    RightHandIndex1: { x: 0, y: 0, z: 0 },
                    RightHandMiddle1: { x: 0, y: 0, z: 0 },
                    RightHandRing1: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "DATILOLOGIA_A": {
        duration: 1600,
        keyframes: [
            {
                time: 0.45,
                pose: {
                    RightArm: { x: -0.5, y: -0.2, z: 0.4 },
                    RightForeArm: { x: -1.2, y: -0.1, z: 0 },
                    RightHandThumb1: { x: -0.9, y: 0.2, z: 0 },
                    RightHandIndex1: { x: 1.5, y: 0, z: 0 },
                    RightHandMiddle1: { x: 1.5, y: 0, z: 0 },
                    RightHandRing1: { x: 1.5, y: 0, z: 0 },
                    RightHandPinky1: { x: 1.5, y: 0, z: 0 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    RightHandThumb1: { x: 0, y: 0, z: 0 },
                    RightHandIndex1: { x: 0, y: 0, z: 0 },
                    RightHandMiddle1: { x: 0, y: 0, z: 0 },
                    RightHandRing1: { x: 0, y: 0, z: 0 },
                    RightHandPinky1: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "DUVIDA_CABICA": {
        duration: 2000,
        keyframes: [
            {
                time: 0.4,
                pose: {
                    Neck: { x: 0.1, y: 0.2, z: -0.15 },
                    Head: { x: 0.15, y: 0.2, z: -0.1 },
                    Spine1: { x: -0.05, y: 0.1, z: 0 }
                }
            },
            {
                time: 1.0,
                pose: {
                    Neck: { x: 0, y: 0, z: 0 },
                    Head: { x: 0, y: 0, z: 0 },
                    Spine1: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "AFIRMACAO": {
        duration: 1800,
        keyframes: [
            { time: 0.25, pose: { Head: { x: -0.25, y: 0, z: 0 } } },
            { time: 0.55, pose: { Head: { x: 0.1, y: 0, z: 0 } } },
            { time: 0.8, pose: { Head: { x: -0.2, y: 0, z: 0 } } },
            { time: 1.0, pose: { Head: { x: 0, y: 0, z: 0 } } }
        ]
    },

    "NEGACAO": {
        duration: 1800,
        keyframes: [
            { time: 0.3, pose: { Head: { x: 0, y: 0.35, z: 0 } } },
            { time: 0.65, pose: { Head: { x: 0, y: -0.35, z: 0 } } },
            { time: 1.0, pose: { Head: { x: 0, y: 0, z: 0 } } }
        ]
    },

    "MUNDO_ESPACO": {
        duration: 2400,
        keyframes: [
            {
                time: 0.35,
                pose: {
                    RightArm: { x: -0.7, y: -0.4, z: 0.5 },
                    RightForeArm: { x: -0.9, y: 0, z: 0 },
                    LeftArm: { x: -0.7, y: 0.4, z: -0.5 },
                    LeftForeArm: { x: -0.9, y: 0, z: 0 },
                    Spine1: { x: -0.1, y: 0, z: 0 }
                }
            },
            {
                time: 0.7,
                pose: {
                    RightArm: { x: -0.4, y: -0.1, z: 0.2 },
                    LeftArm: { x: -0.4, y: 0.1, z: -0.2 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    LeftArm: { x: 0.1, y: -0.1, z: 0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    LeftForeArm: { x: -0.2, y: 0, z: 0 },
                    Spine1: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "POSTURA_TROCA": {
        duration: 2200,
        keyframes: [
            {
                time: 0.45,
                pose: {
                    Spine: { x: 0, y: -0.3, z: -0.05 },
                    Spine1: { x: 0, y: -0.2, z: 0 },
                    Head: { x: 0, y: 0.15, z: 0 }
                }
            },
            {
                time: 1.0,
                pose: {
                    Spine: { x: 0, y: 0, z: 0 },
                    Spine1: { x: 0, y: 0, z: 0 },
                    Head: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "OI": {
        duration: 2000,
        keyframes: [
            {
                time: 0.3,
                pose: {
                    RightArm: { x: -0.6, y: -0.4, z: 0.9 },
                    RightForeArm: { x: -1.5, y: -0.2, z: 0 },
                    RightHand: { x: 0, y: 0, z: 0.3 },
                    Head: { x: 0, y: -0.1, z: 0 }
                }
            },
            {
                time: 0.6,
                pose: {
                    RightArm: { x: -0.6, y: -0.4, z: 1.1 },
                    RightHand: { x: 0, y: 0.4, z: 0.5 }
                }
            },
            {
                time: 0.82,
                pose: {
                    RightArm: { x: -0.6, y: -0.4, z: 0.8 },
                    RightHand: { x: 0, y: -0.4, z: 0.1 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    RightHand: { x: 0, y: 0, z: 0 },
                    Head: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "TUDO_BEM": {
        duration: 2200,
        keyframes: [
            {
                time: 0.35,
                pose: {
                    RightArm: { x: -0.5, y: -0.2, z: 0.4 },
                    RightForeArm: { x: -1.1, y: 0, z: 0 },
                    Head: { x: 0.1, y: -0.15, z: 0 }
                }
            },
            {
                time: 0.75,
                pose: {
                    RightArm: { x: -0.7, y: -0.4, z: 0.6 },
                    RightForeArm: { x: -1.4, y: -0.2, z: 0 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    Head: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "POR_FAVOR": {
        duration: 2000,
        keyframes: [
            {
                time: 0.45,
                pose: {
                    RightArm: { x: -0.7, y: 0.2, z: 0.3 },
                    RightForeArm: { x: -1.5, y: 0.3, z: 0 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 }
                }
            }
        ]
    },

    "OBRIGADO": {
        duration: 2200,
        keyframes: [
            {
                time: 0.35,
                pose: {
                    RightArm: { x: -1.1, y: 0.2, z: 0.6 },
                    RightForeArm: { x: -2.1, y: 0.3, z: 0 },
                    Head: { x: -0.1, y: 0, z: 0 }
                }
            },
            {
                time: 0.7,
                pose: {
                    RightArm: { x: -0.6, y: -0.1, z: 0.2 },
                    RightForeArm: { x: -0.7, y: 0, z: 0 },
                    Head: { x: -0.2, y: 0, z: 0 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    Head: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "DESCULPA": {
        duration: 2200,
        keyframes: [
            {
                time: 0.4,
                pose: {
                    RightArm: { x: -0.7, y: 0.2, z: 0.4 },
                    RightForeArm: { x: -1.6, y: 0.3, z: 0 },
                    RightHandThumb1: { x: -0.8, y: 0, z: 0 },
                    Head: { x: -0.15, y: 0, z: 0.1 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    RightHandThumb1: { x: 0, y: 0, z: 0 },
                    Head: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "BANHEIRO": {
        duration: 2200,
        keyframes: [
            {
                time: 0.45,
                pose: {
                    RightArm: { x: -0.8, y: -0.3, z: 0.8 },
                    RightForeArm: { x: -1.7, y: -0.2, z: 0 },
                    RightHand: { x: 0, y: -0.6, z: 0.3 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    RightHand: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "AGUA": {
        duration: 2000,
        keyframes: [
            {
                time: 0.45,
                pose: {
                    RightArm: { x: -0.8, y: 0.2, z: 0.6 },
                    RightForeArm: { x: -1.9, y: 0.3, z: 0 },
                    RightHandThumb1: { x: -0.6, y: 0, z: 0 },
                    RightHandIndex1: { x: 0.0, y: 0, z: 0 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    RightHandThumb1: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    },

    "COMER": {
        duration: 2000,
        keyframes: [
            {
                time: 0.45,
                pose: {
                    RightArm: { x: -0.8, y: 0.3, z: 0.5 },
                    RightForeArm: { x: -2.0, y: 0.4, z: 0 },
                    RightHandIndex1: { x: 1.2, y: 0, z: 0 },
                    RightHandMiddle1: { x: 1.2, y: 0, z: 0 }
                }
            },
            {
                time: 1.0,
                pose: {
                    RightArm: { x: 0.1, y: 0.1, z: -0.1 },
                    RightForeArm: { x: -0.2, y: 0, z: 0 },
                    RightHandIndex1: { x: 0, y: 0, z: 0 },
                    RightHandMiddle1: { x: 0, y: 0, z: 0 }
                }
            }
        ]
    }
};
