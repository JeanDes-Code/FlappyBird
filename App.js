import {
  Canvas,
  Group,
  Image,
  matchFont,
  Text,
  useImage,
} from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import {
  useSharedValue,
  withTiming,
  Easing,
  withSequence,
  withRepeat,
  useFrameCallback,
  useDerivedValue,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';

const GRAVITY = 1000;
const JUMP_FORCE = -500;

const App = () => {
  const { width, height } = useWindowDimensions();

  const [score, setScore] = useState(0);

  const backgroundImage = useImage(
    require('./assets/sprites/background-day.png'),
  );
  const greenPipeBottom = useImage(require('./assets/sprites/pipe-green.png'));
  const greenPipeTop = useImage(require('./assets/sprites/pipe-green-top.png'));
  const base = useImage(require('./assets/sprites/base.png'));
  const bird = useImage(require('./assets/sprites/yellowbird-upflap.png'));

  const gameOver = useSharedValue(false);
  const pipeX = useSharedValue(width);

  const birdX = width / 4;
  const birdY = useSharedValue(height / 3);

  const birdYVelocity = useSharedValue(0);

  const baseHeight = 150;
  const pipeWidth = 103;
  const pipeHeight = 640;
  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(() => pipeOffset.value - pipeHeight / 2);
  const bottomPipeY = useDerivedValue(
    () => height - pipeHeight / 2 + pipeOffset.value,
  );
  const pipeSpeed = useDerivedValue(() => {
    return interpolate(score, [0, 20], [1, 2]);
  });

  const obstacles = useDerivedValue(() => [
    // Bottom pipe
    {
      x: pipeX.value,
      y: height - pipeHeight / 2 + pipeOffset.value,
      h: pipeHeight,
      w: pipeWidth,
    },
    // Top pipe
    {
      x: pipeX.value,
      y: pipeOffset.value - pipeHeight / 2,
      h: pipeHeight,
      w: pipeWidth,
    },
  ]);

  useEffect(() => {
    mapMovement();
  }, []);

  const mapMovement = () => {
    pipeX.value = withSequence(
      withTiming(width, { duration: 0 }),
      withTiming(-150, {
        duration: 3000 / pipeSpeed.value,
        easing: Easing.linear,
      }),
      withTiming(width, { duration: 0 }),
    );
  };

  // Score logic
  useAnimatedReaction(
    () => pipeX.value,
    (currentValue, previousValue = 0) => {
      const middleScreen = birdX - pipeWidth;

      // Change offset for the next pipe
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;
        cancelAnimation(pipeX);
        runOnJS(mapMovement)();
      }

      if (
        currentValue !== previousValue &&
        previousValue &&
        currentValue <= middleScreen &&
        previousValue > middleScreen
      ) {
        runOnJS(setScore)(score + 1);
      }
    },
  );

  const isPointCollidingWithRect = (point, rect) => {
    'worklet';

    return (
      point.x >= rect.x && // right of the left edge
      point.x <= rect.x + rect.w && // left of the right edge
      point.y >= rect.y && // bellow the top
      point.y <= rect.y + rect.h // above the bottom
    );
  };

  // Collision detection
  useAnimatedReaction(
    () => birdY.value,
    // Ground collision detection
    (currentValue, previousValue) => {
      const center = {
        x: birdX + 32,
        y: birdY.value + 24,
      };

      if (currentValue > height - baseHeight + 24 || currentValue < 0) {
        gameOver.value = true;
      }

      // Pipe collision detection

      const isColliding = obstacles.value.some((rect) =>
        isPointCollidingWithRect(center, rect),
      );

      if (isColliding) {
        gameOver.value = true;
      }
    },
  );

  // Game over animation
  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);
      }
    },
  );

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value) {
      return;
    }

    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  const restartGame = () => {
    'worklet';
    birdY.value = height / 3;
    birdYVelocity.value = 0;
    gameOver.value = false;
    pipeX.value = width;
    runOnJS(mapMovement)();
    runOnJS(setScore)(0);
  };

  const gesture = Gesture.Tap().onStart(() => {
    if (gameOver.value) {
      restartGame();
    } else {
      birdYVelocity.value = JUMP_FORCE;
    }
  });

  const birdTransform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(
          birdYVelocity.value,
          [-500, 500],
          [-0.5, 0.5],
          Extrapolation.CLAMP,
        ),
      },
    ];
  });
  const birdOrigin = useDerivedValue(() => {
    return {
      x: width / 4 + 32,
      y: birdY.value + 24,
    };
  });

  const fontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });

  const fontStyle = {
    fontFamily,
    fontSize: 50,
    FontWeight: 'bold',
  };

  const font = matchFont(fontStyle);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          {/* Background */}
          <Image
            image={backgroundImage}
            fit='cover'
            width={width}
            height={height}
          />

          {/* Pipes */}
          <Image
            image={greenPipeBottom}
            x={pipeX}
            y={bottomPipeY}
            width={pipeWidth}
            height={pipeHeight}
            fit='contain'
          />

          <Image
            image={greenPipeTop}
            x={pipeX}
            y={topPipeY}
            width={pipeWidth}
            height={pipeHeight}
            fit='contain'
          />

          {/* base */}
          <Image
            image={base}
            x={0}
            y={height - 75}
            width={width}
            height={baseHeight}
            fit='cover'
          />

          {/* bird */}
          <Group
            transform={birdTransform}
            origin={birdOrigin}
          >
            <Image
              image={bird}
              x={birdX}
              y={birdY}
              width={64}
              height={48}
              fit='contain'
            />
          </Group>

          {/* Score */}
          <Text
            x={width / 2 - fontStyle.fontSize / 2}
            y={100}
            text={`${score.toLocaleString()}`}
            font={font}
            color='white'
          />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
