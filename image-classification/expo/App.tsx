import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image ,Button, StyleSheet, TouchableOpacity} from 'react-native';
import * as tf from '@tensorflow/tfjs';
import { fetch, decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';

import { Camera, CameraPictureOptions  , CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';


const App = () => {
  const [isTfReady, setIsTfReady] = useState(false);
  const [result, setResult] = useState('');
  const [permissions, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState('');  // Initialize image state as an empty string
  const cameraRef = useRef<Camera>(null);

  if (!permissions) {
    // Camera permissionss are still loading.
    return (
    <View>
      <Text style={styles.message}>Loading</Text>
    </View>);
  }

  if (!permissions.granted) {
    // Camera permissionss are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const load = async (imageUri: string) => {
    try {
      // Load mobilenet.
      await tf.ready();
      const model = await mobilenet.load();
      setIsTfReady(true);
      
      // Read the file at the `file://` URI
      const FileENcoder = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to binary array (Uint8Array)
      const binaryStrings = atob(FileENcoder);
      const imageDataArrayBuffers = new ArrayBuffer(binaryStrings.length);
      const imageDato = new Uint8Array(imageDataArrayBuffers);
      for (let i = 0; i < binaryStrings.length; i++) {
        imageDato[i] = binaryStrings.charCodeAt(i);
      }
      const imageTensor = decodeJpeg(imageDato);
      //console.log(imageTensor);

      //Run 
      const prediction = await model.classify(imageTensor);
      console.log(permissions);
      if (prediction && prediction.length > 0) {
        setResult(
          `${prediction[0].className} (${prediction[0].probability.toFixed(3)})`
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  const _takePicture = async () => {
    try{
      if (cameraRef.current) {
        let photo = await cameraRef.current.takePictureAsync();
        console.log('Picture saved:', photo.uri); // The URI of the picture
        setImage(photo.uri); // Set the image URI in state to display
        load(photo.uri);
      }
    }
    catch(err){
      console.warn(err);
    }
  }

  //Model View for HTML
  return (
    <View
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    > 
      <CameraView ref={cameraRef} style={styles.camera}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={_takePicture}>
            <Text style={styles.text}>TakePicture</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      {image ? <Image source={{ uri: image }} style={{ width: 100, height: 100 }} /> : null}
      {!isTfReady && <Text>Loading TFJS model...</Text>}
      {isTfReady && result === '' && <Text>Classifying...</Text>}
      {result !== '' && <Text>{result}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    width: '100%',
    height: '70%',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default App;
