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
- Use Chrome Browser to view
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

* Please note that due to limitations of the Chrome simulator, hover feedback is not functional. However, this interaction would not apply to the mobile app experience regardless, since hover states are not supported on mobile devices.

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

### Suggested Steps:
1. Swipe the images on the upper middle part of the screen to switch between stored itineraries
2. Select the **“Itinerary”** option on the toolbar

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
4. Redo steps 2–3 with a different category, type and cost still < $500
5. (Optional) Continue to add expenses with different categoreis to observe the change in the display.
6. Select the "<- Trips" button
7. Select **“+ Add Itinerary”**, enter any name, start and end dates and select **“Save”**
8. Select the **“...”** button on the newly added itinerary, and delete it
9. Go the "..." button on the "Calgary" itinerary, select "Share"
10. On the share screen, add an email in the input and select "Share Event". Dismiss the pop-up when ready
12. Select the **“Calgary”** itinerary

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
5. Enter a title, date, start and end times, event (optional) location, (optional) category, (optional) cost, and (optional) description and select **“Add Event”**
6. Select the new event that was just added, observe the new info

---

## Itinerary Day / Event Info

### Functionalities Implemented:
- Day itinerary view
- Back to week view
- Add event
- Remove event

### Not Implemented:
- N/A

### Suggested Steps:
1. Select the title of any day (i.e Friday, May 1)
2. (Optional) Select edit dates and attempt to change the start date of the itinerary
3. Select any event object, then select **“Remove Event”** and confirm deletion with the **"Remove"** button when the pop-up appears.
4. Back on the Itinerary Day view, select any other available day
5. Select an event and While in the event info screen, select the pencil icon.
6. Change any of the input fields and select "Save" to confirm the changes.
7. Using the navigation bar at the bottom of the screen, select the **“Explore”** option
8. Return to the Itinerary screen view using the "<" button twice.
9. Using the navigation bar on the bottom, select the **"Explore"** option

---

## Explore / Saved Events Screen

### Functionalities Implemented:
- Sorting events
- Filtering events
- Saved events/removing saved events
- Search events
- Saving to history/removing from history
- Sending booking requests
- Adding booked event to different itineraries
- Event conflict resolution options

### Not Implemented:
- Conflicting event overriding

### Suggested Steps:
1. Using the **“Search…”** bar at the top of the screen, enter any combination of words or letters
2. Select the **“Filter”** option and select any dates, starts, ends, categories or locations → **Apply Filters**
3. In the input bar between the **"Filter** and **"Saved"** select the option **Dates:Calgary Trip"**.
4. Select the **"Rock Concert"** result.
5. Select the heart icon and dismiss the pop-up, then use the header back button to return to the search page.
6. Select the **"Saved"** button and go back to the **"Rock Concert"** result.
7. Select the **"Create Booking Request"** button.
8. (Optional) Try to submit the request without filling in any information.
9. Fill in all the required info and select the **"Send Request"** button.
10. Using the itinerary dropdown, select the Calgary itinerary, then select the **"Add to Itinerary"** option
11. On the event conflict pop-up, press the **"View conflicting event"** text. Go to the conflciting event on the itinerary week view and remove it.
12. Using the back button on the header, return to the booking request page and try to book the request again.
13. Return to the **"Saved"** events screen using the back button
14. Choose any saved search result and use the heart icon to un-save it.
15. Using the navigation bar, select **“Account”**

---

## Account Information / Emergency Info Screen

### Functionalities Implemented:
- Changing and saving personal info
- Logging out
- Saving and editing emergency contact info
- Searching for medical centers/hospitals

### Not Implemented:
- Canceling personal info changes
- Password resetting
- Language preferences
- Deleting account

### Suggested Steps:
1. In **Personal Information**, change any field and select **“Save Changes”**
2. Verify pop-up indicating info is saved
3. (Optional) Interact with non-implemented sections
4. Scroll to the bottom of the screen and select **“Emergency Information”**
5. Enter a name and phone number → **Save Info**
6. (Optional) Use **Edit Contact**, or **Call**
7. (Optional) Empty city and province searhc input and select **Search**, dismiss missing info pop-up
8. Enter **Calgary** and **Alberta** → **Search**
9. Select any search result using the **“>”** icon
10. Return using the **"<-"** button the webpage
11. Go back to the account screen using the header back button
12. Select **“Sign Out”**

---

# END OF WALKTHROUGH
