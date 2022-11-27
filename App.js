import React, {useEffect, useState} from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Linking,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';
import MapView, {PROVIDER_GOOGLE, Marker} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

const {width, height} = Dimensions.get('window');
const App = () => {
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        setCurrentCords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        fetchCPRCoordinates();
      },
      error => {
        console.log(error);
      },
    );
  };
  const [currentCords, setCurrentCords] = useState({
    latitude: 2.2584850000000003,
    longitude: 4.411203,
  });
  const [cords, setCords] = useState([]);
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
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
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
      </MapView>
      <TouchableOpacity
        onPress={getCurrentLocation}
        style={styles.refreshButton}>
        <Text style={styles.refreshButtonText}>Reload</Text>
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
