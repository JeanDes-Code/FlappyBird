import { Canvas, Group, Image, useImage } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
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
  const backgroundImage = useImage(
    require('./assets/sprites/background-day.png'),
  );
  const greenPipeBottom = useImage(require('./assets/sprites/pipe-green.png'));
  const greenPipeTop = useImage(require('./assets/sprites/pipe-green-top.png'));
  const base = useImage(require('./assets/sprites/base.png'));
  const bird = useImage(require('./assets/sprites/yellowbird-upflap.png'));

  const x = useSharedValue(width);

  const birdY = useSharedValue(height / 3);
  const birdYVelocity = useSharedValue(0);
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

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt) {
      return;
    }

    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

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

  const gesture = Gesture.Tap().onStart(() => {
    birdYVelocity.value = JUMP_FORCE;
  });

  const pipeOffset = 0;

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
            width={103}
            height={640}
            fit='contain'
          />
          <Image
            image={greenPipeTop}
            x={x}
            y={pipeOffset - 320}
            width={103}
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
              x={width / 4}
              y={birdY}
              width={64}
              height={48}
              fit='contain'
            />
          </Group>
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
