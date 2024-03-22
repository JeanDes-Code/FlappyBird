import {
  Canvas,
  Circle,
  Fill,
  FontWeight,
  Group,
  Image,
  matchFont,
  Rect,
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
  const x = useSharedValue(width);

  const birdX = width / 4;
  const birdY = useSharedValue(height / 3);
  const birdYVelocity = useSharedValue(0);

  const birdCenterX = useDerivedValue(() => birdX + 32);
  const birdCenterY = useDerivedValue(() => birdY.value + 24);

  const baseHeight = 150;
  const pipeWidth = 103;
  const pipeHeight = 640;
  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(() => pipeOffset.value - pipeHeight / 2);
  const bottomPipeY = useDerivedValue(
    () => height - pipeHeight / 2 + pipeOffset.value,
  );

  const obstacles = useDerivedValue(() => {
    const allObstacles = [];
    // add bottom pipe
    allObstacles.push({
      x: x.value,
      y: height - pipeHeight / 2 + pipeOffset.value,
      h: pipeHeight,
      w: pipeWidth,
    });

    // add top pipe
    allObstacles.push({
      x: x.value,
      y: pipeOffset.value - pipeHeight / 2,
      h: pipeHeight,
      w: pipeWidth,
    });

    return allObstacles;
  });

  useEffect(() => {
    mapMovement();
  }, []);

  const mapMovement = () => {
    x.value = withRepeat(
      withSequence(
        withTiming(-150, {
          duration: 3000,
          easing: Easing.linear,
        }),
        withTiming(width, {
          duration: 0,
        }),
      ),
      -1,
    );
  };

  // Score logic
  useAnimatedReaction(
    () => x.value,
    (currentValue, previousValue = 0) => {
      const middleScreen = birdX - pipeWidth;

      // Change offset for the next pipe
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;
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
      if (currentValue > height - baseHeight + 24 || currentValue < 0) {
        gameOver.value = true;
      }

      // Pipe collision detection

      const isColliding = obstacles.value.some((rect) =>
        isPointCollidingWithRect(
          { x: birdCenterX.value, y: birdCenterY.value },
          rect,
        ),
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
        cancelAnimation(x);
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
    x.value = width;
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
            x={x}
            y={bottomPipeY}
            width={pipeWidth}
            height={pipeHeight}
            fit='contain'
          />

          <Image
            image={greenPipeTop}
            x={x}
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

          {/* Sim */}
          {/* <Circle
            cx={birdCenterX}
            cy={birdCenterY}
            r={25}
            color='white'
            opacity={0.4}
          />
          <Rect
            x={x}
            y={height - 320 + pipeOffset.value}
            width={pipeWidth}
            height={pipeHeight}
            color='red'
            opacity={0.4}
          />
          <Rect
            x={x}
            y={pipeOffset.value - pipeHeight / 2}
            width={pipeWidth}
            height={pipeHeight}
            color='red'
            opacity={0.4}
          /> */}

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
