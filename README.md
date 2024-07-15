## Status: in Development

# MMM-Emotion

A module that makes MagicMirror² recognize your emotions

## Example

...

## Dependencies

- Installation of [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror)
- python-shell (will be installed automatically when running npm install)
- [OpenCV](http://opencv.org)
- deepface
- tf_keras

## Installation

In your terminal, navigate to the modules folder and clone this repository.

```
$ cd ~/MagicMirror/modules
$ git clone https://github.com/SandraPrestel/MMM-Emotion.git
```

To install the dependencies, navigate into the module folder and execute npm install:

```
$ cd MMM-Emotion
$ npm install
```

Additionally, you might have to install tf_keras and deepface, if it is not already available on your machine:

```
$ cd ~/
$ pip install deepface
$ pip install tf_keras
```

## Minimal configuration

Add this to your `~/MagicMirror/config/config.js`

```js
{
    ...
}
```

## Default configuration

```js
{
  config: {
    ...
  }
}
```

## Config options

| **Option** | **Default** | **Description** |
| ---------- | ----------- | --------------- |
| `...       | ...         | ...             |
| ...        | ...         | ...             |
