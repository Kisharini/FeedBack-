# FeedBack App – Full System Context for Development

FeedBack is a multi-role food rescue and affordable food distribution platform. The goal is to reduce food waste by allowing vendors to sell surplus food at discounted prices or donate excess food to verified NGOs. The platform also supports affordable food access for individual recipients and delivery coordination through riders.

## Core Purpose

The system has two main flows:
# FeedBack App - Full System Context

FeedBack was a multi-role food rescue and affordable food distribution platform. The goal was to reduce food waste by allowing vendors to sell surplus food at discounted prices or donate excess food to verified NGOs. The platform also supported affordable food access for individual recipients and delivery coordination through riders.

## Core Purpose

The system had two main flows:

1. Affordable food purchase flow for individual recipients.
2. Food donation flow for NGOs, including instant donations and future food request campaigns.

The app should avoid mixing role logic too deeply inside separate folders. Backend logic should be structured by feature/module, not by role, because many features involve multiple roles in the same flow.

Example:
- Donation involves NGO, vendor, rider, and admin.
- Delivery involves vendor, rider, NGO/recipient, and admin.
- Future request involves NGO, vendor, rider, and admin.

## User Roles

The system has five user roles:
The app avoided mixing role logic too deeply inside separate folders. Backend logic was structured by feature or module, not by role, because many features involved multiple roles in the same flow.

Examples:
- Donation involved NGO, vendor, rider, and admin.
- Delivery involved vendor, rider, NGO or recipient, and admin.
- Future request involved NGO, vendor, rider, and admin.

## User Roles

The system had five user roles:

- INDIVIDUAL
- NGO
- VENDOR
- RIDER
- ADMIN

All users register and log in through the same authentication system. After login, users are redirected to their role-specific dashboard.

## Authentication Flow

Users register with basic details and selected role.
=======
All users registered and logged in through the same authentication system. After login, users were redirected to their role-specific dashboard.

## Authentication Flow

Users registered with basic details and a selected role.
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f

Basic flow:

Register
→ Save user in database
→ Login
→ Verify email and password
→ Generate JWT token
→ Return user role
→ Frontend redirects to correct dashboard

Use role-based access control middleware to protect routes.

Example:
- Only NGO can create future food requests.
- Only vendor can create food listings and submit offers.
- Only rider can accept delivery tasks.
- Only admin can verify NGOs and manage users.

## Recommended Backend Structure

Use feature-based structure:

src/
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── foodListingController.js
│   ├── donationController.js
│   ├── futureRequestController.js
│   ├── vendorOfferController.js
│   ├── deliveryController.js
│   └── adminController.js
│
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── foodListingRoutes.js
│   ├── donationRoutes.js
│   ├── futureRequestRoutes.js
│   ├── vendorOfferRoutes.js
│   ├── deliveryRoutes.js
│   └── adminRoutes.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   └── errorMiddleware.js
│
├── services/
│   ├── notificationService.js
│   ├── deliveryService.js
│   ├── matchingService.js
│   └── socketService.js
│
├── validators/
├── utils/
├── config/
└── server.js

Avoid this structure:

controllers/
├── ngo/
├── vendor/
├── rider/

Reason: it creates duplicated logic and makes shared flows harder to maintain.

## Individual Recipient Flow

Individual recipients use the platform to buy affordable discounted food.

Flow:

Individual registers/logs in
→ Browses discounted food listings
→ Views food details
→ Places order
→ Makes payment or confirms order
→ Delivery task is created
→ Rider accepts delivery
→ Rider picks up food from vendor
→ Rider delivers to individual
→ Individual confirms receipt
→ Order is completed

Individuals cannot request donations directly.

## NGO Flow

NGOs must be verified before accessing donation features.

NGO registration flow:

NGO registers
→ Uploads organisation verification details/documents
→ Admin reviews NGO profile
→ Admin approves or rejects NGO
→ Approved NGO can use donation features

There are two NGO donation modes.

## NGO Mode 1: Instant Donation Request

This is used when a vendor has already listed available food for donation.

Flow:

Vendor creates donation listing
→ NGO browses donation listings
→ NGO requests donation
→ Vendor accepts or rejects request
→ If accepted, delivery task is created
→ Rider accepts task
→ Rider picks up food from vendor
→ Rider delivers to NGO
→ NGO confirms receipt
→ Donation transaction is completed

## NGO Mode 2: Future Food Request Campaign

This is used when an NGO needs food for a future event, such as flood relief, orphanage feeding, temple event, school event, or community food distribution.

Flow:

NGO creates future food request
→ Request includes event name, event date, location, food type, meals needed, and purpose
→ Vendors receive or view the request
→ Vendors submit offers
→ NGO reviews vendor offers
→ NGO accepts suitable offers
→ Delivery is scheduled
→ Rider is assigned or accepts delivery task
→ Vendor prepares food on event day
→ Rider picks up food
→ Rider delivers to NGO/event location
→ NGO confirms receipt
→ Future request is completed

This feature allows NGOs to request food even when vendors have not listed donation food yet.

## Vendor Flow

Vendors can sell discounted surplus food or donate food.

Vendor discounted food flow:

Vendor registers/logs in
→ Creates discounted food listing
→ Individual places order
→ Vendor accepts/prepares order
→ Delivery task is created
→ Rider picks up food
→ Rider delivers to individual
→ Order is completed

Vendor donation flow:

Vendor creates donation listing
→ NGO requests donation
→ Vendor accepts request
→ Delivery task is created
→ Rider picks up food
→ Rider delivers to NGO
→ Donation completed

Vendor future request flow:

Vendor views NGO future food requests
→ Vendor submits offer
→ NGO accepts offer
→ Vendor prepares food on scheduled date
→ Rider delivers food to NGO/event location
→ Request completed

## Rider Flow

Riders handle delivery logistics for both discounted food orders and donation deliveries.

Flow:

Rider registers/logs in
→ Views available delivery tasks
→ Accepts delivery task
→ Navigates to vendor pickup location
→ Verifies pickup using QR code or OTP
→ Picks up food
→ Navigates to recipient/NGO location
→ Delivers food
→ Confirms delivery completion
→ Delivery status updates to completed

Delivery statuses can include:
=======
-> Save user in database
-> Login
-> Verify email and password
-> Generate JWT token
-> Return user role
-> Frontend redirected to the correct dashboard

Role-based access control middleware was used to protect routes.

Examples:
- Only NGO could create future food requests.
- Only vendor could create food listings and submit offers.
- Only rider could accept delivery tasks.
- Only admin could verify NGOs and manage users.

## Recommended Backend Structure

The project used a feature-based structure:

src/
|-- controllers/
|   |-- authController.js
|   |-- userController.js
|   |-- foodListingController.js
|   |-- donationController.js
|   |-- futureRequestController.js
|   |-- vendorOfferController.js
|   |-- deliveryController.js
|   `-- adminController.js
|
|-- routes/
|   |-- authRoutes.js
|   |-- userRoutes.js
|   |-- foodListingRoutes.js
|   |-- donationRoutes.js
|   |-- futureRequestRoutes.js
|   |-- vendorOfferRoutes.js
|   |-- deliveryRoutes.js
|   `-- adminRoutes.js
|
|-- middleware/
|   |-- authMiddleware.js
|   |-- roleMiddleware.js
|   `-- errorMiddleware.js
|
|-- services/
|   |-- notificationService.js
|   |-- deliveryService.js
|   |-- matchingService.js
|   `-- socketService.js
|
|-- validators/
|-- utils/
|-- config/
`-- server.js

The project avoided the following structure:

controllers/
|-- ngo/
|-- vendor/
`-- rider/

That structure created duplicated logic and made shared flows harder to maintain.

## Individual Recipient Flow

Individual recipients used the platform to buy affordable discounted food.

Flow:

Individual registered or logged in
-> Browsed discounted food listings
-> Viewed food details
-> Placed order
-> Made payment or confirmed order
-> Delivery task was created
-> Rider accepted delivery
-> Rider picked up food from vendor
-> Rider delivered to individual
-> Individual confirmed receipt
-> Order was completed

Individuals could not request donations directly.

## NGO Flow

NGOs had to be verified before accessing donation features.

NGO registration flow:

NGO registered
-> Uploaded organisation verification details or documents
-> Admin reviewed NGO profile
-> Admin approved or rejected NGO
-> Approved NGO could use donation features

There were two NGO donation modes.

## NGO Mode 1: Instant Donation Request

This mode was used when a vendor had already listed available food for donation.

Flow:

Vendor created donation listing
-> NGO browsed donation listings
-> NGO requested donation
-> Vendor accepted or rejected request
-> If accepted, delivery task was created
-> Rider accepted task
-> Rider picked up food from vendor
-> Rider delivered to NGO
-> NGO confirmed receipt
-> Donation transaction was completed

## NGO Mode 2: Future Food Request Campaign

This mode was used when an NGO needed food for a future event, such as flood relief, orphanage feeding, temple events, school events, or community food distribution.

Flow:

NGO created future food request
-> Request included event name, event date, location, food type, meals needed, and purpose
-> Vendors received or viewed the request
-> Vendors submitted offers
-> NGO reviewed vendor offers
-> NGO accepted suitable offers
-> Delivery was scheduled
-> Rider was assigned or accepted delivery task
-> Vendor prepared food on event day
-> Rider picked up food
-> Rider delivered to the NGO or event location
-> NGO confirmed receipt
-> Future request was completed

This feature allowed NGOs to request food even when vendors had not listed donation food yet.

## Vendor Flow

Vendors could sell discounted surplus food or donate food.

Vendor discounted food flow:

Vendor registered or logged in
-> Created discounted food listing
-> Individual placed order
-> Vendor accepted or prepared order
-> Delivery task was created
-> Rider picked up food
-> Rider delivered to individual
-> Order was completed

Vendor donation flow:

Vendor created donation listing
-> NGO requested donation
-> Vendor accepted request
-> Delivery task was created
-> Rider picked up food
-> Rider delivered to NGO
-> Donation was completed

Vendor future request flow:

Vendor viewed NGO future food requests
-> Vendor submitted offer
-> NGO accepted offer
-> Vendor prepared food on the scheduled date
-> Rider delivered food to the NGO or event location
-> Request was completed

## Rider Flow

Riders handled delivery logistics for both discounted food orders and donation deliveries.

Flow:

Rider registered or logged in
-> Viewed available delivery tasks
-> Accepted delivery task
-> Navigated to vendor pickup location
-> Verified pickup using QR code or OTP
-> Picked up food
-> Navigated to recipient or NGO location
-> Delivered food
-> Confirmed delivery completion
-> Delivery status updated to completed

Delivery statuses included:
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f

- PENDING
- ASSIGNED
- PICKED_UP
- IN_TRANSIT
- DELIVERED
- CANCELLED

## Admin Flow

Admins manage platform safety, verification, and monitoring.

Flow:

Admin logs in
→ Views dashboard
→ Verifies NGO accounts
→ Approves or blocks users if needed
→ Monitors food listings
→ Monitors orders, donations, and deliveries
→ Handles complaints or abuse reports
→ Views analytics and impact reports

Admin should not be involved in every normal transaction, only verification, monitoring, and issue handling.

## Main Feature Modules

Develop the backend module by module in this order:
=======
Admins managed platform safety, verification, and monitoring.

Flow:

Admin logged in
-> Viewed dashboard
-> Verified NGO accounts
-> Approved or blocked users if needed
-> Monitored food listings
-> Monitored orders, donations, and deliveries
-> Handled complaints or abuse reports
-> Viewed analytics and impact reports

Admin was not involved in every normal transaction, only in verification, monitoring, and issue handling.

## Main Feature Modules

The backend was developed module by module in this order:
1. Authentication Module
2. User Profile Module
3. Food Listing Module
4. Order Module
5. Donation Request Module
6. Future Food Request Module
7. Vendor Offer Module
8. Delivery Module
9. Notification Module
10. Admin Module
11. Analytics / Impact Module

## Initial Database Design

Start simple and extend later.
The initial design started simple and expanded later.

Core tables:

User
- id
- name
- email
- password
- role
- createdAt
- updatedAt

NGOProfile
- id
- userId
- organizationName
- registrationNumber
- verificationStatus
- documents

VendorProfile
- id
- userId
- businessName
- businessType
- businessAddress

RiderProfile
- id
- userId
- vehicleType
- plateNumber
- licenseNumber

FoodListing
- id
- vendorId
- title
- description
- quantity
- price
- listingType
- expiryTime
- status

Order
- id
- individualId
- listingId
- vendorId
- status
- totalAmount

DonationRequest
- id
- ngoId
- listingId
- vendorId
- status

FutureFoodRequest
- id
- ngoId
- eventName
- eventDate
- location
- mealsNeeded
- foodType
- purpose
- urgency
- status

VendorOffer
- id
- futureRequestId
- vendorId
- quantityOffered
- offerType
- message
- status

Delivery
- id
- riderId
- pickupLocation
- dropoffLocation
- relatedType
- relatedId
- status
- trackingData

## Important Logic Rule

Use relatedType and relatedId in Delivery so one delivery system can support multiple cases.
The system used `relatedType` and `relatedId` in `Delivery` so one delivery system could support multiple cases.

Examples:

relatedType = ORDER
relatedId = orderId

relatedType = DONATION_REQUEST
relatedId = donationRequestId

relatedType = FUTURE_REQUEST
relatedId = futureFoodRequestId

This avoids creating separate delivery tables for each feature.

## Listing Types

Food listings should support different types:
=======
This avoided creating separate delivery tables for each feature.

## Listing Types

Food listings supported different types:

- DISCOUNTED_SALE
- DONATION

A discounted listing is for individual recipients.
A donation listing is for NGOs.
A discounted listing was for individual recipients.
A donation listing was for NGOs.

## Status Examples

FoodListing status:
- AVAILABLE
- RESERVED
- CLAIMED
- EXPIRED
- CANCELLED

Order status:
- PENDING
- CONFIRMED
- PREPARING
- OUT_FOR_DELIVERY
- COMPLETED
- CANCELLED

DonationRequest status:
- PENDING
- ACCEPTED
- REJECTED
- COMPLETED
- CANCELLED

FutureFoodRequest status:
- OPEN
- PARTIALLY_FULFILLED
- FULFILLED
- COMPLETED
- CANCELLED

VendorOffer status:
- PENDING
- ACCEPTED
- REJECTED
- CANCELLED

## Development Principle

Build simple first. Avoid overcomplicating with AI, real-time tracking, payment gateway, and advanced analytics at the beginning.

Suggested MVP order:

1. Register and login
2. Role-based dashboard redirect
3. Vendor creates food listing
4. Individual browses and orders discounted food
5. NGO requests donation listing
6. Vendor accepts donation request
7. Rider accepts delivery
8. Admin verifies NGO
9. Future request campaign
10. Notifications and analytics

## Final Summary

FeedBack is a role-based food rescue and affordable food distribution platform. Vendors provide discounted or donated surplus food. Individual recipients buy affordable food, while verified NGOs claim donations or create future food request campaigns. Vendors can respond to NGO requests, riders manage delivery, and admins monitor the system. The backend should be modular, feature-based, and protected using JWT authentication and role-based access control.
=======
