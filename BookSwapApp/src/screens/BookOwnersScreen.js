import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import Button from '../components/Button';

const BookOwnersScreen = ({ route }) => {
  const { bookTitle, owners } = route.params;
  const { user } = useAuth();

  const handleRequestBook = async () => {
    try {
      await apiService.requestBook(bookTitle);
      Alert.alert(
        'Request Sent!',
        `Your request for "${bookTitle}" has been sent. The owners will be notified.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send book request. Please try again.');
    }
  };

  const handleContactOwner = (ownerUsername) => {
    Alert.alert(
      'Contact Owner',
      `Would you like to send a message to ${ownerUsername} about "${bookTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Message', 
          onPress: () => {
            // In a real app, this would open a messaging interface
            Alert.alert(
              'Message Sent',
              `Your message has been sent to ${ownerUsername}. They will be notified about your interest in "${bookTitle}".`
            );
          }
        }
      ]
    );
  };

  const OwnerCard = ({ owner }) => (
    <View style={styles.ownerCard}>
      <View style={styles.ownerHeader}>
        <View style={styles.ownerAvatar}>
          <Text style={styles.ownerInitial}>
            {owner.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.ownerInfo}>
          <Text style={styles.ownerName}>{owner.username}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.ownerLocation}>{owner.city}</Text>
          </View>
        </View>
        <View style={styles.ownerActions}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => handleContactOwner(owner.username)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.ownerFooter}>
        <Button
          title="Contact Owner"
          onPress={() => handleContactOwner(owner.username)}
          variant="outline"
          size="small"
          style={styles.contactButton}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.bookTitle}>"{bookTitle}"</Text>
        <Text style={styles.headerSubtitle}>
          {owners.length} owner{owners.length !== 1 ? 's' : ''} found in {user.city}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.ownersSection}>
          <Text style={styles.sectionTitle}>Book Owners</Text>
          <Text style={styles.sectionSubtitle}>
            These people in your city own this book and might be willing to share it
          </Text>
          
          {owners.map((owner, index) => (
            <OwnerCard key={owner.id || index} owner={owner} />
          ))}
        </View>

        <View style={styles.requestSection}>
          <View style={styles.requestCard}>
            <View style={styles.requestIcon}>
              <Ionicons name="megaphone" size={24} color="#F59E0B" />
            </View>
            <View style={styles.requestContent}>
              <Text style={styles.requestTitle}>Send a General Request</Text>
              <Text style={styles.requestDescription}>
                Let everyone in {user.city} know you're looking for this book
              </Text>
            </View>
          </View>
          <Button
            title="Send Book Request"
            onPress={handleRequestBook}
            style={styles.requestButton}
          />
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Tips for Book Swapping</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.tipText}>Be polite and respectful when contacting owners</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.tipText}>Suggest meeting in public places for exchanges</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.tipText}>Consider offering one of your books in return</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.tipText}>Agree on return dates and book condition</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  ownersSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  ownerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ownerInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  ownerActions: {
    flexDirection: 'row',
  },
  messageButton: {
    padding: 8,
  },
  ownerFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contactButton: {
    width: '100%',
  },
  requestSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  requestContent: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  requestButton: {
    width: '100%',
  },
  tipsSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default BookOwnersScreen;
