# Walkthrough Instructions

## Group 3 Team Members
Nicole Heather, 30163278, nicole.heather@ucalgary.ca  
Akib Hasan Aryan, 30141456, akib.aryan@ucalgary.ca  
Jericho Huelar, 30196518, jericho.huelar@ucalgary.ca  
Chantal del Carmen, 30129615, chantal.delcarmen@ucalgary.ca  
Keenan Hanearin-Balczer, 30171362, keenan.hanearinbalcz@ucalgary.ca  

---

## Setup
- View the deployed app from the link:  
  https://nicoleheather.github.io/CPSC-481---Group-3---Tut-3/
- Open DevTools (Ctrl + Shift + I or F12)
- Toggle the Device Toolbar (Ctrl + Shift + M) to enable responsive/mobile preview.
- In the device toolbar's device dropdown, choose "Edit" → "Add custom device" (or choose "Responsive").  
  Create a device with these values:
  - Device name: **iPhone 16**
  - Width: **393**
  - Height: **852**
  - Device pixel ratio (DPR): **3** (optional)
  - User agent string: leave default or choose an iPhone-like UA
- Select your new "iPhone 16" device from the list. DevTools will resize the viewport to 393×852.
- Hard-reload the page (Right-click refresh → "Empty Cache and Hard Reload") so CSS and JS load correctly in the emulated device mode.

---

# Walkthrough

## Login Screen

### Functionalities Implemented:
- Login  
- Password reset  

### Not Implemented:
- Sign up

### Suggested Steps:
1. Select **“Forgot Password”**
2. Enter an email (i.e personal, work, throwaway, etc)
3. Select **“Send reset link”**
4. Dismiss the alert
5. Enter a username and password
6. (Optional) Press the eye icon on the password input to reveal the text
7. Press the **“Login”** button. You should be taken to the home page.

---

## Home Screen

### Functionalities Implemented:
- Upcoming itineraries
- Navigation bar:
  - Home: The current screen
  - Itinerary: Where the itineraries are stored
  - Explore: Search for events and make bookings
  - Account: Personal info and account management, i.e settings

### Not Implemented:
- Quick actions
- Create Itinerary
- Create event

### Suggested Steps:
- Swipe the images on the upper middle part of the screen to switch between stored itineraries
- Select the **“Itinerary”** option on the toolbar

---

## Itinerary Screen

### Functionalities Implemented:
- Budget tracking
- Adding expenses
- Adding itineraries
- Removing itineraries
- Sharing itineraries

### Not Implemented:
- N/A

### Suggested Steps:
1. Select the **“Manage Budget”** button
2. Select **“+ Add Expense”**
3. Enter any name, type and a cost < $500
4. Redo steps 2–3 with a different name, type and cost still < $500
5. Dismiss the budget pop-up
6. Select **“+ Add Itinerary”**, enter any name, start and end dates and select **“save”**
7. Select the **“...”** button on the newly added itinerary, and delete it
8. Select the **“Calgary”** itinerary

---

## Itinerary Week Screen

### Functionalities Implemented:
- Week view (next and previous week)
- Editing trip start date
- Adding custom events

### Not Implemented:
- N/A

### Suggested Steps:
1. Select **“Edit Dates”** and enter a date after the original start date
2. Attempt to enter the start date again, but ensure it’s previous to the original start date
3. Select the **“Next”** button
4. Select the **“+”** button on any day
5. Enter a time and title and select **“add”**

---

## Itinerary Day / Event Info / Share Screen

### Functionalities Implemented:
- Day itinerary view
- Back to week view
- (TBD) Add event
- (TBD) Remove event
- Share events through email

### Not Implemented:
- N/A

### Suggested Steps:
1. Select **“Monday, May 4”** and scroll down to the event **“Farewell Dinner”**
2. While in the event info screen, select **“Edit”**
3. Modify, enter or remove any information as desired, and select **“Save”**  
   (This is known as a “custom” event)
4. Select **“Remove”** and confirm deletion when the pop-up appears
5. Back on the Itinerary Day view, select any other available day
6. While in the event info screen, select **“Edit”**.  
   Observe that some fields are not editable (non-custom event)
7. Select **“Share”**, and on the share event screen add any email address and select **“Share Event”**
8. Dismiss the pop-up when ready
9. Return to the event info screen using the **“<”** button on the header
10. Select **“Remove”** and confirm deletion with the **“Delete”** button
11. Using the navigation bar at the bottom of the screen, select the **“Explore”** option

---

## Explore / Saved Events Screen

### Functionalities Implemented:
- Sorting events
- Filtering events
- Saved events/removing saved events
- Search events
- Saving to history/removing from history
- Sending booking requests
- (TBA) Adding booked event to different itineraries
- Event conflict resolution options

### Not Implemented:
- Conflicting event overriding

### Suggested Steps:
1. Using the **“Search…”** bar at the top of the screen, enter any combination of words or letters
2. Select the **“Filter”** option and select any dates, starts, ends, categories or locations → **Apply Filters**
3. Clear the filtering and search input, scroll to find the event **“Lakeside Brunch”** and select it
4. While on the event booking screen, select **“Create Booking Request”**
5. On the booking request screen, enter all required info (red asterisks)
6. Select **“Send Booking Request”**
7. When the conflict pop-up appears, select **“View Conflicting Event”**
8. Observe the event, then use the **“<”** button
9. On the pop-up again, select **“Back to Booking”** and return to Explore
10. Use the **“Saved”** button to go to the saved events screen
11. Observe that there are no saved events at the moment
12. Select a search result
13. On its event booking screen, select **“Save to History”** and dismiss the pop-up
14. Return to the saved events screen — you should now see an event in history
15. Repeat with another search result
16. Still on the saved events page, select an event
17. Select **“Create a Booking Request”**, fill it out, then **“Send Booking Request”**
18. Once processed, choose an itinerary via dropdown → **Add to Itinerary**  
   (This should take you to the Itinerary screen)
19. Using the navigation bar, select **“Account”**

---

## Account Information / Emergency Info Screen

### Functionalities Implemented:
- Changing and saving personal info
- Logging out
- Saving and editing emergency contact info
- Searching for medical centers

### Not Implemented:
- Canceling personal info changes
- Password resetting
- Language preferences
- Saving Preferences
- Deleting account

### Suggested Steps:
1. In **Personal Information**, change any field and select **“Save Changes”**
2. Verify pop-up indicating info is saved
3. (Optional) Interact with non-implemented sections
4. Scroll to the red-background section and select **“Emergency Information”**
5. Enter a name and phone number → **Save Info**
6. (Optional) Use **Edit Contact**, **Save**, or **Call**
7. (Optional) Select **Search**, dismiss missing info pop-up
8. Enter **Calgary** and **Alberta** → **Search**
9. Select any search result using the **“>”** icon
10. Return using the **“<”**
11. Select **“Sign Out”**

---

# END OF WALKTHROUGH
