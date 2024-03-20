import { Canvas, Image, useImage } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  useSharedValue,
  withTiming,
  Easing,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';

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

  const pipeOffset = 0;

  return (
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
      <Image
        image={bird}
        x={width / 4}
        y={height / 2}
        width={64}
        height={48}
        fit='contain'
      />
    </Canvas>
  );
};
export default App;
