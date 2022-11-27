import React, {useEffect, useState, useRef} from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Linking,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';
import MapView, {PROVIDER_GOOGLE, Marker, Polyline} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import PolylineManager from '@mapbox/polyline';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';

// Must be outside of any component LifeCycle (such as `componentDidMount`).
PushNotification.configure({
  // (optional) Called when Token is generated (iOS and Android)
  onRegister: function (token) {
    console.log('TOKEN:', token);
  },
  // IOS ONLY (optional): default: all - Permissions to register.
  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },
  popInitialNotification: true,
  requestPermissions: true,
});

const {width, height} = Dimensions.get('window');
const App = () => {
  useEffect(() => {
    getCurrentLocation();
    const type = 'notification';
    PushNotificationIOS.addEventListener(type, onRemoteNotification);
    return () => {
      PushNotificationIOS.removeEventListener(type);
    };
  }, []);

  const [currentCords, setCurrentCords] = useState({
    latitude: 2.2584850000000003,
    longitude: 4.411203,
  });
  const [cords, setCords] = useState([]);
  const [directionCords, setDirectionCords] = useState([]);
  const map = useRef(null);

  const onRemoteNotification = notification => {
    const isClicked = notification.getData().userInteraction === 1;

    if (isClicked) {
      // Navigate user to another screen
    } else {
      // Do something else with push notification
    }
    // Use the appropriate result based on what you needed to do for this notification
    const result = PushNotificationIOS.FetchResult.NoData;
    notification.finish(result);
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        setCurrentCords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        fetchCPRCoordinates();
        getDirections(
          `${position.coords.latitude},${position.coords.longitude}`,
          '37.7550547219463,-122.44364289326744',
        );
      },
      error => {
        console.log(error);
      },
    );
  };

  const getDirections = async (startLoc, destinationLoc) => {
    try {
      let resp = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}&key=AIzaSyBZGGyN1gV6wm-trwFnO7QBcC0yjx5ZIlE`,
      );
      let respJson = await resp.json();
      let points = PolylineManager.decode(
        respJson.routes[0].overview_polyline.points,
      );
      let coords = points.map((point, index) => {
        return {
          latitude: point[0],
          longitude: point[1],
        };
      });
      setDirectionCords(coords);
    } catch (error) {
      alert(error);
    }
  };
  const fetchCPRCoordinates = () => {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    fetch('https://health-hackathon1.herokuapp.com/get_cordinates', {
      method: 'POST',
      body: JSON.stringify({
        lat: currentCords.latitude,
        long: currentCords.longitude,
      }),
      headers: myHeaders,
    })
      .then(res => res.text())
      .then(res => {
        setCords(JSON.parse(res));
      })
      .catch(error => {
        console.log(error);
      });
  };
  const onMarkPress = startLoc => {
    const directionUrl = `https://maps.google.com/?q=${currentCords.latitude},${currentCords.longitude}&key=AIzaSyBZGGyN1gV6wm-trwFnO7QBcC0yjx5ZIlE`;
    console.log(directionUrl);
    Linking.openURL(directionUrl);
  };

  const onZoomInPress = () => {
    map?.current?.getCamera().then(cam => {
      cam.zoom += 1;
      map?.current?.animateCamera(cam);
    });
  };
  const onZoomOutPress = () => {
    map?.current?.getCamera().then(cam => {
      cam.zoom -= 1;
      map?.current?.animateCamera(cam);
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        ref={map}
        style={styles.map}
        region={{
          ...currentCords,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}>
        {cords.map(({lat, long}, index) => (
          <Marker
            onPress={() => onMarkPress(`${lat},${long}`)}
            key={index}
            coordinate={{latitude: lat, longitude: long}}
            pinColor={'red'}
            title={'AED Kit'}>
            <Image
              source={require('./assets/first-aid-box.png')}
              style={{height: 35, width: 35}}
            />
          </Marker>
        ))}
        <Marker
          key={10000}
          coordinate={currentCords}
          pinColor={'green'}
          title={'Your Location'}>
          <Image
            source={require('./assets/doctor.png')}
            style={{height: 40, width: 40}}
          />
        </Marker>
        <Marker
          key={10001}
          coordinate={{
            latitude: 37.7550547219463,
            longitude: -122.44364289326744,
          }}
          pinColor={'green'}
          onPress={() => onMarkPress('37.7550547219463,-122.44364289326744')}
          title={'Patient Location'}>
          <Image
            source={require('./assets/patient.png')}
            style={{height: 40, width: 40}}
          />
        </Marker>
        <Polyline
          coordinates={directionCords}
          strokeWidth={4}
          strokeColor="#0BDA51"
        />
      </MapView>
      <TouchableOpacity
        onPress={getCurrentLocation}
        style={styles.refreshButton}>
        <Text style={styles.refreshButtonText}>Reload</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 90,
          right: 20,
          height: 30,
          width: 80,
          backgroundColor: 'white',
          borderRadius: 5,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onZoomInPress}>
        <Text>Zoom In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 50,
          right: 20,
          backgroundColor: 'white',
          height: 30,
          width: 80,
          borderRadius: 5,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onZoomOutPress}>
        <Text>Zoom Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    height: height,
    width: width,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  refreshButton: {
    height: 30,
    width: 80,
    borderRadius: 10,
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
