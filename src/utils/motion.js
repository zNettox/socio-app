export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.4, ease: 'easeIn' } }
}

export const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.5, ease: 'easeIn' } }
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
}

export const scaleUp = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3, ease: 'easeIn' } }
}

export const glowPulse = {
  hidden: { boxShadow: '0 0 0px 0px rgba(186,117,23,0)' },
  visible: { 
    boxShadow: ['0 0 0px 0px rgba(186,117,23,0.2)', '0 0 20px 4px rgba(186,117,23,0.5)', '0 0 0px 0px rgba(186,117,23,0.2)'],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
  }
}

export const floatAnim = {
  hidden: { y: 0 },
  visible: {
    y: [-8, 8, -8],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
  }
}
