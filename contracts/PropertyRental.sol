// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PropertyRental {
    struct Property {
        uint256 id;
        address landlord;
        string title;
        string description;
        uint256 pricePerMonth;
        bool isAvailable;
        string imageUrl;
        string location;
    }
    
    struct RentalApplication {
        uint256 propertyId;
        address tenant;
        uint256 duration;
        uint256 totalAmount;
        bool isApproved;
        bool isPaid;
        uint256 applicationTime;
        string tenantName;
        string tenantEmail;
        string tenantPhone;
    }
    
    struct Payment {
        uint256 applicationId;
        address tenant;
        address landlord;
        uint256 amount;
        uint256 timestamp;
        string transactionHash;
    }
    
    mapping(uint256 => Property) public properties;
    mapping(uint256 => RentalApplication) public applications;
    mapping(uint256 => Payment[]) public propertyPayments;
    mapping(address => uint256[]) public tenantApplications;
    mapping(address => uint256[]) public landlordProperties;
    
    uint256 public propertyCounter;
    uint256 public applicationCounter;
    
    event PropertyListed(uint256 indexed propertyId, address indexed landlord);
    event ApplicationSubmitted(uint256 indexed applicationId, uint256 indexed propertyId, address indexed tenant);
    event ApplicationApproved(uint256 indexed applicationId);
    event PaymentMade(uint256 indexed applicationId, address indexed tenant, uint256 amount);
    
    function listProperty(
        string memory _title,
        string memory _description,
        uint256 _pricePerMonth,
        string memory _imageUrl,
        string memory _location
    ) public {
        propertyCounter++;
        properties[propertyCounter] = Property({
            id: propertyCounter,
            landlord: msg.sender,
            title: _title,
            description: _description,
            pricePerMonth: _pricePerMonth,
            isAvailable: true,
            imageUrl: _imageUrl,
            location: _location
        });
        
        landlordProperties[msg.sender].push(propertyCounter);
        emit PropertyListed(propertyCounter, msg.sender);
    }
    
    function submitApplication(
        uint256 _propertyId,
        uint256 _duration,
        string memory _tenantName,
        string memory _tenantEmail,
        string memory _tenantPhone
    ) public {
        require(properties[_propertyId].isAvailable, "Property not available");
        require(_duration > 0, "Duration must be greater than 0");
        
        applicationCounter++;
        uint256 totalAmount = properties[_propertyId].pricePerMonth * _duration;
        
        applications[applicationCounter] = RentalApplication({
            propertyId: _propertyId,
            tenant: msg.sender,
            duration: _duration,
            totalAmount: totalAmount,
            isApproved: false,
            isPaid: false,
            applicationTime: block.timestamp,
            tenantName: _tenantName,
            tenantEmail: _tenantEmail,
            tenantPhone: _tenantPhone
        });
        
        tenantApplications[msg.sender].push(applicationCounter);
        emit ApplicationSubmitted(applicationCounter, _propertyId, msg.sender);
    }
    
    function approveApplication(uint256 _applicationId) public {
        RentalApplication storage application = applications[_applicationId];
        require(properties[application.propertyId].landlord == msg.sender, "Only landlord can approve");
        require(!application.isApproved, "Already approved");
        
        application.isApproved = true;
        emit ApplicationApproved(_applicationId);
    }
    
    function makePayment(uint256 _applicationId) public payable {
        RentalApplication storage application = applications[_applicationId];
        require(application.tenant == msg.sender, "Only tenant can pay");
        require(application.isApproved, "Application not approved");
        require(!application.isPaid, "Already paid");
        require(msg.value > 0, "Payment amount must be greater than 0");
        
        address landlord = properties[application.propertyId].landlord;
        
        // Transfer payment to landlord
        payable(landlord).transfer(msg.value);
        
        // Record payment
        propertyPayments[application.propertyId].push(Payment({
            applicationId: _applicationId,
            tenant: msg.sender,
            landlord: landlord,
            amount: msg.value,
            timestamp: block.timestamp,
            transactionHash: ""
        }));
        
        application.isPaid = true;
        properties[application.propertyId].isAvailable = false;
        
        emit PaymentMade(_applicationId, msg.sender, msg.value);
    }
    
    function getProperty(uint256 _propertyId) public view returns (Property memory) {
        return properties[_propertyId];
    }
    
    function getApplication(uint256 _applicationId) public view returns (RentalApplication memory) {
        return applications[_applicationId];
    }
    
    function getTenantApplications(address _tenant) public view returns (uint256[] memory) {
        return tenantApplications[_tenant];
    }
    
    function getLandlordProperties(address _landlord) public view returns (uint256[] memory) {
        return landlordProperties[_landlord];
    }
    
    function getPropertyPayments(uint256 _propertyId) public view returns (Payment[] memory) {
        return propertyPayments[_propertyId];
    }
    
    function getAllProperties() public view returns (Property[] memory) {
        Property[] memory allProperties = new Property[](propertyCounter);
        for (uint256 i = 1; i <= propertyCounter; i++) {
            allProperties[i - 1] = properties[i];
        }
        return allProperties;
    }
}
