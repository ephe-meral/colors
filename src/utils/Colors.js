import * as tf from '@tensorflow/tfjs';
import * as data from '../data/xkcd.json';

const hexToRgb = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
};

const colors = data.colors.reduce((acc, { color, hex }) => {
  acc[color] = tf.tensor1d(hexToRgb(hex));
  return acc;
}, {});

const distance = (vectorA, vectorB) => tf.util.distSquared(vectorA.dataSync(), vectorB.dataSync());

class Colors {
  static nearestColor(R, G, B) {
    const vec = tf.tensor1d([R, G, B]);
    return Object.entries(colors)
      .map(([word, v]) => ({
        word,
        distance: distance(vec, v)
      }))
      .sort((a, b) => a.distance - b.distance)[0];
  }
}

export { Colors };
