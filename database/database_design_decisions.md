# Database Design Decisions

Database Selection
- the finalized database implementation will use Amazon DynamoDB as the NoSQL database.
- DynamoDB was selected to support the application's scheduling and course-planning requirements while providing a flexible structure for storing and retrieving data.
- The DynamoDB model was designed based on the system's data requirements and expected retrievals.

Backend and AI Integration
- The DynamoDB database serves as the data layer for the backend and AI/optimization components.
- The backend will retrieve and update data in DynamoDB based on application requests.
- The AI/optimization component interprets the student's request and converts it into structured request for data retrieval from DynamoDB. The results can be returned to the backend and stored in DynamoDB.
- The database is responsible for storing and providing the data required by these components, while the backend and AI/optimization components handle application logic and schedule generation.
