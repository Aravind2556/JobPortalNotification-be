const Express = require('express')
const UserModel = require('../models/User')
const isAuth = require('../middleware/isAuth')
const NotificationModel = require('../models/Notification')
const sendMail = require("../utils/sendMail");

const AuthRouter = Express.Router()


// AuthRouter.post('/login', async(req, res)=>{
//     try{
//         const {email, password} = req.body

//         if(!email || !password){
//             return res.send({success: false, message: 'Please provide all details!'})
//         }

//         const user = await UserModel.findOne({email})

//         if(!user){
//             return res.send({success: false, message: 'Invalid Email!'})
//         }

//         if(user.password !== password){
//             return res.send({success: false, message: "Invalid Password!"})
//         }

//         req.session.user = {
//             id: user.id,
//             fullname: user.fullname,  
//             email: user.email,  
//             contact: user.contact,  
//             role: user.role
//         }

//         req.session.save((err)=>{
//             if(err){
//                 return res.send({success: false, message: "Failed to create session!"})
//             }

//             return res.send({success: true, message: "Logged in successfully!", user: req.session.user})
//         })

//     }
//     catch(err){
//         console.log("Error in login:",err)
//         return res.send({success: false, message: 'Trouble in login! Please contact support Team.'})
//     }
// })


// AuthRouter.post('/login', async (req, res) => {
//     try {
//         const { email, password, fingerPrintId, browserName, ipAddress } = req.body;

//         if (!email || !password || !fingerPrintId || !browserName || !ipAddress) {
//             return res.send({ success: false, message: 'Please provide all details!' });
//         }

//         // 1. Find user
//         const user = await UserModel.findOne({ email });
//         if (!user) {
//             return res.send({ success: false, message: 'Invalid Email!' });
//         }

//         // 2. Password check
//         if (user.password !== password) {   // 🔹 plain password check
//             return res.send({ success: false, message: 'Invalid Password!' });
//         }
//         // If hashed password
//         // const isMatch = await bcrypt.compare(password, user.password);
//         // if (!isMatch) return res.send({ success: false, message: 'Invalid Password!' });

//         // 3. Check if this device already exists
//         let existingDevice = user.deviceInfos.find(
//             d => d.fingerPrintId === fingerPrintId &&
//                 d.browserName === browserName &&
//                 d.ipAddress === ipAddress
//         );

//         if (existingDevice) {
//             // 🔹 Same device → just update login time
//             existingDevice.recentLoggedTime.push(new Date());
//         } else {
//             // 🔹 New device → save this device info
//             user.deviceInfos.push({
//                 fingerPrintId,
//                 browserName,
//                 ipAddress,
//                 recentLoggedTime: [new Date()]
//             });
//         }

//         // save user with updated devices
//         await user.save();

//         // 4. Create session
//         req.session.user = {
//             id: user._id,
//             fullname: user.fullname,
//             email: user.email,
//             contact: user.contact,
//             role: user.role,
//         };

//         req.session.save((err) => {
//             if (err) {
//                 return res.send({ success: false, message: "Failed to create session!" });
//             }
//             return res.send({
//                 success: true,
//                 message: "Logged in successfully!",
//                 user: req.session.user,
//             });
//         });

//     } catch (err) {
//         console.error("Error in login:", err);
//         return res.send({
//             success: false,
//             message: "Trouble in login! Please contact support Team.",
//         });
//     }
// });



// AuthRouter.post('/login', async (req, res) => {
//     try {
//         const { email, password, fingerPrintId, browserName, ipAddress } = req.body;

//         if (!email || !password) {
//             return res.send({ success: false, message: 'Please provide email & password!' });
//         }

//         // 1. Find user
//         const user = await UserModel.findOne({ email });
//         if (!user) {
//             return res.send({ success: false, message: 'Invalid Email!' });
//         }

//         // 2. Password check (plain check – if hashed, replace with bcrypt)
//         if (user.password !== password) {
//             return res.send({ success: false, message: 'Invalid Password!' });
//         }

//         // 3. Check role based login process
//         if (user.role === "employer") {
//             console.log("called")
//             // Device details must be present for employer
//             if (!fingerPrintId || !browserName || !ipAddress) {
//                 return res.send({ success: false, message: 'Device details required for Employer login!' });
//             }

//             // 3a. Check if device already exists
//             let existingDevice = user.deviceInfos.find(
//                 d => d.fingerPrintId === fingerPrintId &&
//                     d.browserName === browserName &&
//                     d.ipAddress === ipAddress
//             );

//             if (existingDevice) {
//                 // Same device → just update login time
//                 existingDevice.recentLoggedTime.push(new Date());

//                 const admins = await UserModel.find({ role: 'admin' });
//                 if (!admins || admins.length === 0) {
//                     return res.status(400).json({ success: false, message: "Admin not found." });
//                 }
//                 // Notify all admins
//                 const adminNotifications = admins.map(admin => ({
//                     userId: admin.id,
//                     title: 'Employer Logged',
//                     description: `Employer ${user.fullname} (${user.email}) logged in from ${browserName} / ${ipAddress}`,
//                     type: 'device-status'
//                 }));
//                 await NotificationModel.insertMany(adminNotifications);
//             } else {
//                 // New device → save this device info
//                 user.deviceInfos.push({
//                     fingerPrintId,
//                     browserName,
//                     ipAddress,
//                     recentLoggedTime: [new Date()]
//                 });
//             }

//             await user.save();

//         }
//         // 🔹 For non-employer roles → just allow login, no device check, no notification.

//         // 4. Create session
//         req.session.user = {
//             id: user._id,
//             fullname: user.fullname,
//             email: user.email,
//             contact: user.contact,
//             role: user.role,
//         };

//         req.session.save((err) => {
//             if (err) {
//                 return res.send({ success: false, message: "Failed to create session!" });
//             }
//             return res.send({
//                 success: true,
//                 message: "Logged in successfully!",
//                 user: req.session.user,
//             });
//         });

//     } catch (err) {
//         console.error("Error in login:", err);
//         return res.send({
//             success: false,
//             message: "Trouble in login! Please contact support Team.",
//         });
//     }
// });


AuthRouter.post('/login', async (req, res) => {
    try {
        const { email, password, fingerPrintId, browserName, ipAddress } = req.body;

        if (!email || !password) {
            return res.send({ success: false, message: 'Please provide email & password!' });
        }

        // 1️⃣ Find user
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.send({ success: false, message: 'Invalid Email!' });
        }

        // 2️⃣ Password check
        if (user.password !== password) {
            return res.send({ success: false, message: 'Invalid Password!' });
        }

        // 3️⃣ Employer device + notification handling
        if (user.role === "employer") {
            if (!fingerPrintId || !browserName || !ipAddress) {
                return res.send({ success: false, message: 'Device details required for Employer login!' });
            }

            // check device
            let existingDevice = user.deviceInfos.find(
                d => d.fingerPrintId === fingerPrintId &&
                    d.browserName === browserName &&
                    d.ipAddress === ipAddress
            );

            if (existingDevice) {
                existingDevice.recentLoggedTime.push(new Date());
            } else {
                user.deviceInfos.push({
                    fingerPrintId,
                    browserName,
                    ipAddress,
                    recentLoggedTime: [new Date()]
                });

                // send mail when new device created
                await sendMail(user.email, "Login Alert", "You have logged in successfully!");

                // Notification only for new device
                const admins = await UserModel.find({ role: 'admin' });
                if (admins && admins.length > 0) {
                    const notifications = admins.map(admin => ({
                        userId: admin._id,
                        title: "New Device Login",
                        description: `Employer ${user.fullname} (${user.email}) logged in from NEW device → ${browserName} / ${ipAddress}`,
                        type: "device-status"
                    }));
                    await NotificationModel.insertMany(notifications);
                }
            }

            await user.save();

            // 🔔 Notification for ALL admins (both new & existing devices)
            try {
                const admins = await UserModel.find({ role: 'admin' });
                if (admins && admins.length > 0) {
                    const notifications = admins.map(admin => ({
                        userId: admin._id,
                        title: "Employer Login",
                        description: `Employer ${user.fullname} (${user.email}) logged in from ${browserName} / ${ipAddress}`,
                        type: "device-status"
                    }));
                    await NotificationModel.insertMany(notifications);
                }
            } catch (notifyErr) {
                console.error("❌ Failed to create notification:", notifyErr);
            }
        }

        // 4️⃣ Create session
        req.session.user = {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            contact: user.contact,
            role: user.role,
        };

        req.session.save((err) => {
            if (err) {
                return res.send({ success: false, message: "Failed to create session!" });
            }
            return res.send({
                success: true,
                message: "Logged in successfully!",
                user: req.session.user,
            });
        });

    } catch (err) {
        console.error("Error in login:", err);
        return res.send({
            success: false,
            message: "Trouble in login! Please contact support Team.",
        });
    }
});

AuthRouter.post('/register', async (req, res)=>{
    try{
        const { fullname, email, contact, password, role } = req.body

        if (!fullname || !email || !contact || !password || !role){
            return res.send({success: false, message: 'Please provide all details!'})
        }
        
        const fetchUser = await UserModel.findOne({email: email.toLowerCase()})
        if(fetchUser){
            return res.send({success: false, message: 'Account already exist! Please try login.'})
        }

        let Users = await UserModel.find({});
        let userId;
        if(Users.length>0){
            let last_user = Users.slice(-1)[0];
            userId = last_user.id+1;
        }else{ 
            userId = 1
        }

        const newUser = new UserModel({
            id: userId,
            fullname: fullname,
            email: email,
            contact: contact,
            password: password,
            role: role
        })

        const saveUser = await newUser.save()

        if(saveUser){

            req.session.user = {
                id: saveUser.id,
                fullname: saveUser.fullname,  
                email: saveUser.email,  
                contact: saveUser.contact,  
                role: saveUser.role,
            }
    
            req.session.save((err)=>{
                if(err){
                    return res.send({success: false, message: "Failed to create session!"})
                }
    
                return res.send({success: true, message: "User Registration successfully!", user: req.session.user})
            })

        }
        else{
            return res.send({success: false, message: 'Failed to create User!'})
        }

    }
    catch(err){
        console.log("Error in Register:",err)
        return res.send({success: false, message: 'Trouble in Registration! Please contact admin.'})
    }
})


AuthRouter.get('/checkauth', async(req, res)=>{
    try{
        if(req.session.user){

            const fetchUser = await UserModel.findOne({email: req.session.user.email.toLowerCase()}).select("-password -_id")
            if(!fetchUser){
                return res.send({success: false, message: 'User not found!'})
            }

            return res.send({success: true, user: fetchUser, message: "Successfully fetched the current logged in User!"})
        }
        else{
            return res.send({success: false, message: "No loggin detected! please login and try again."})
        }
    }
    catch(err){
        console.log("Error in Checking Authentication:",err)
        return res.send({success: false, message: 'Trouble in Checking Authentication! Please contact support Team.'})
    }
})


AuthRouter.get('/logout', isAuth, async(req, res)=>{
    try{
        if(req.session.user){
            req.session.destroy((err) => {
                if (err) {
                    console.log("Error in destroying session:", err);
                    return res.send({ success: false, message: "Failed to log out! Please contact developer." });
                }
                return res.send({ success: true, message: "Logged out successfully!" });
            });            
        }
        else{
            return res.send({success: false, message: "Please login and try again later!"})
        }
    }
    catch(err){
        console.log("Trouble in logging out:",err)
        return res.send({success: false, message: "Trouble in logging out! Please contact support Team."})
    }
})


module.exports = AuthRouter