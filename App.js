import {
  Canvas,
  Fill,
  FontWeight,
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

  const x = useSharedValue(width);

  const birdX = width / 4;
  const birdY = useSharedValue(height / 3);
  const birdYVelocity = useSharedValue(0);
  const pipeWidth = 103;

  useEffect(() => {
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
  }, []);

  useAnimatedReaction(
    () => x.value,
    (currentValue, previousValue = 0) => {
      const middleScreen = birdX - pipeWidth;
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

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt) {
      return;
    }

    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  const gesture = Gesture.Tap().onStart(() => {
    birdYVelocity.value = JUMP_FORCE;
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

  const pipeOffset = 0;
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
            y={height - 320 + pipeOffset}
            width={pipeWidth}
            height={640}
            fit='contain'
          />
          <Image
            image={greenPipeTop}
            x={x}
            y={pipeOffset - 320}
            width={pipeWidth}
            height={640}
            fit='contain'
          />

          {/* base */}
          <Image
            image={base}
            x={0}
            y={height - 75}
            width={width}
            height={150}
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
