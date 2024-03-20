import { Canvas, Image, useImage } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';

const App = () => {
  const { width, height } = useWindowDimensions();
  const backgroundImage = useImage(
    require('./assets/sprites/background-day.png'),
  );
  const greenPipeBottom = useImage(require('./assets/sprites/pipe-green.png'));
  const greenPipeTop = useImage(require('./assets/sprites/pipe-green-top.png'));
  const base = useImage(require('./assets/sprites/base.png'));

  const bird = useImage(require('./assets/sprites/yellowbird-upflap.png'));

  const pipeOffset = 0;

  return (
    <Canvas style={{ width, height }}>
      {/* Background */}
      <Image
        image={backgroundImage}
        fit='cover'
        x={0}
        y={0}
        width={width}
        height={height}
      />

      {/* Pipes */}
      <Image
        image={greenPipeBottom}
        x={width / 2}
        y={height - 320 + pipeOffset}
        width={103}
        height={640}
        fit='contain'
      />
      <Image
        image={greenPipeTop}
        x={width / 2}
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
