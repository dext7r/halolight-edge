import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface AnimatedIllustrationProps {
  type: '404' | '403' | '401' | '500' | '503' | 'offline' | 'error';
  icon: LucideIcon;
  iconColor?: string;
}

export function AnimatedIllustration({ type, icon: Icon, iconColor = 'text-primary' }: AnimatedIllustrationProps) {
  const renderDecorativeElements = () => {
    switch (type) {
      case '404':
        return (
          <>
            {/* Floating question marks */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-primary/20 font-bold text-2xl"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + (i % 3) * 20}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.6, 0.3],
                  rotate: [0, 10, 0],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              >
                ?
              </motion.div>
            ))}
            {/* Floating dots */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`dot-${i}`}
                className="absolute w-2 h-2 rounded-full bg-primary/10"
                style={{
                  left: `${10 + i * 12}%`,
                  bottom: `${15 + (i % 4) * 10}%`,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </>
        );

      case '403':
      case '401':
        return (
          <>
            {/* Shield/lock pattern */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute border-2 border-destructive/10 rounded-lg"
                style={{
                  width: 20 + i * 15,
                  height: 20 + i * 15,
                  left: `${15 + i * 12}%`,
                  top: `${20 + (i % 3) * 15}%`,
                }}
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              />
            ))}
            {/* Warning triangles */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`warn-${i}`}
                className="absolute text-warning/20 text-xl"
                style={{
                  right: `${20 + i * 10}%`,
                  top: `${30 + i * 12}%`,
                }}
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              >
                ⚠
              </motion.div>
            ))}
          </>
        );

      case '500':
      case 'error':
        return (
          <>
            {/* Broken pieces effect */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-destructive/10 rounded"
                style={{
                  width: 8 + Math.random() * 12,
                  height: 8 + Math.random() * 12,
                  left: `${Math.random() * 80 + 10}%`,
                  top: `${Math.random() * 60 + 20}%`,
                }}
                animate={{
                  y: [0, 30, 0],
                  x: [0, (Math.random() - 0.5) * 20, 0],
                  rotate: [0, 360],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
            {/* Error pulse rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-destructive/20 rounded-full"
                style={{
                  width: 100 + i * 60,
                  height: 100 + i * 60,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </>
        );

      case '503':
        return (
          <>
            {/* Gears */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute text-info/20 text-4xl"
                style={{
                  left: `${25 + i * 25}%`,
                  top: `${35 + (i % 2) * 20}%`,
                }}
                animate={{
                  rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                ⚙
              </motion.div>
            ))}
            {/* Progress bars */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`bar-${i}`}
                className="absolute h-2 bg-info/10 rounded-full overflow-hidden"
                style={{
                  width: 60 + i * 20,
                  left: `${20 + i * 10}%`,
                  bottom: `${20 + i * 8}%`,
                }}
              >
                <motion.div
                  className="h-full bg-info/30 rounded-full"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeInOut',
                  }}
                  style={{ width: '50%' }}
                />
              </motion.div>
            ))}
          </>
        );

      case 'offline':
        return (
          <>
            {/* Signal waves */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-muted-foreground/10 rounded-full"
                style={{
                  width: 80 + i * 40,
                  height: 80 + i * 40,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
            {/* Disconnected lines */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`line-${i}`}
                className="absolute h-0.5 bg-muted-foreground/10 rounded"
                style={{
                  width: 30 + Math.random() * 40,
                  left: `${Math.random() * 70 + 15}%`,
                  top: `${Math.random() * 50 + 25}%`,
                  rotate: Math.random() * 60 - 30,
                }}
                animate={{
                  opacity: [0.1, 0.4, 0.1],
                  scaleX: [1, 0.5, 1],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative w-48 h-48 mx-auto mb-8">
      {/* Decorative animated elements */}
      {renderDecorativeElements()}

      {/* Main icon container */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <motion.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`w-24 h-24 rounded-3xl bg-card border border-border/50 shadow-lg flex items-center justify-center ${iconColor}`}
        >
          <motion.div
            animate={{
              rotate: type === '503' ? [0, 360] : [0, 5, -5, 0],
            }}
            transition={{
              duration: type === '503' ? 8 : 4,
              repeat: Infinity,
              ease: type === '503' ? 'linear' : 'easeInOut',
            }}
          >
            <Icon className="h-12 w-12" />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
