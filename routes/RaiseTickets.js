const Express = require('express')
const UserModel = require('../models/User')
const isAuth = require('../middleware/isAuth')
const TicketRaiseModel = require('../models/RaiseTickets')
const NotificationModel = require('../models/Notification')
const userModel = require('../models/User')

const RaiseTicketsAuthRouter = Express.Router()

RaiseTicketsAuthRouter.post('/ticket-raise', isAuth, async (req, res) => {
    try {
        const { subject, message } = req.body;
        const user = req?.session?.user;
        if (!subject || !message || !user) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }
        const UserType = user?.role         
        if (UserType === 'admin') {
            return res.status(403).json({ success: false, message: "Admins are not allowed to raise tickets." });
        }
        const newTicket = new TicketRaiseModel({
            userId: user?.id,
            subject,
            message
        });
        const createdTicket = await newTicket.save();
        if (!createdTicket) {
            return res.status(400).json({ success: false, message: "Ticket creation failed." });
        }
        // Send notifications to both admin(s) and the user
        const admins = await UserModel.find({ role: 'admin' });
        const userData = await UserModel.findOne({ id: createdTicket?.userId });
        if (!admins || admins.length === 0 || !userData) {
            return res.status(400).json({ success: false, message: "Admin or User not found." });
        }
        // Notify all admins
        const adminNotifications = admins.map(admin => ({
            userId: admin.id,
            title: 'New Assistance Request Raised',
            description: `A new assistance request ${createdTicket?.ticketId} has been raised by ${userData?.fullname}. Please review and resolve it.`,
            type: 'assistance-alert' 
        }));
        await NotificationModel.insertMany(adminNotifications);

        // Notify the user          
        const userNotification = new NotificationModel({
            userId: userData.id,
            title: 'Assistance Request Received',
            description: `Your assistance request ${createdTicket?.ticketId} has been received. Our team will get back to you shortly`,
            type: 'assistance-alert'
        });
        await userNotification.save();

        return res.status(201).json({ success: true, message: 'Ticket raised successfully'});

    } catch (err) {
        console.error('Error raising ticket:', err);
        return res.status(500).json({ success: false, message: 'Something went wrong', error: err.message });
    }
});


RaiseTicketsAuthRouter.get('/fetch-tickets', isAuth , async (req,res)=>{
    try{
        const user = req?.session?.user;
        const userId = String(user?.id);
        const role = user?.role;
        if (!user || !role || !userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const filter = { userId };
        if (!['admin', 'employer', 'job-seeker'].includes(role)) {
            return res.status(403).json({ success: false, message: "Access denied for this role" });
        }
        let ticketData;
        if (role === 'admin') {
            ticketData = await TicketRaiseModel.find({});
        } else if (['employer', 'job-seeker'].includes(role)) {
            ticketData = await TicketRaiseModel.find(filter);
        }
        if (!ticketData || ticketData.length === 0) {
            return res.status(200).json({ success: true, message: "No tickets found", ticket: [] });
        }else{
            return res.status(200).json({ success: true, message: "Tickets fetched successfully", ticket: ticketData });
        }
    }
    catch(err){
        console.log('Error fetching tickets:', err);
        return res.status(500).json({ success: false, message: 'Something went wrong', error: err.message });
    }
})


RaiseTicketsAuthRouter.get('/fetch-tickets/:ticketId', isAuth, async (req, res) => {
    try {
        const user = req?.session?.user;
        const role = user?.role;
        const { ticketId } = req.params;
        if (!user || !role || !ticketId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }      
        if (!['admin', 'employer', 'job-seeker'].includes(role)) {
            return res.status(403).json({ success: false, message: "Access denied for this role" });
        }

        const  findTicket = await TicketRaiseModel.findOne({ ticketId: ticketId })
        if (!findTicket){
            return res.status(403).json({ success: false, message: "Access denied for this role" });
        }
        const userData = await UserModel.findOne({ id: Number(findTicket?.userId)})
        if(!userData){
            return res.status(403).json({ success: false, message: "Access denied for this role" })
        }
        return res.status(200).json({success: true,message: "Ticket fetched successfully", ticket: findTicket, user: userData});        
    }
    catch (err) {
        console.log('Error fetching tickets:', err);
        return res.status(500).json({ success: false, message: 'Something went wrong', error: err.message });
    }
})


RaiseTicketsAuthRouter.put('/resolve-ticket', isAuth, async (req, res) => {
    try {
        const { ticketId } = req.body;
        const user = req?.session?.user;
        const role = user?.role;
        if (!ticketId || !user || role !== 'admin' ) {
            return res.status(400).json({ success: false, message: "Invalid request or unauthorized access." });
        }
        const ticket = await TicketRaiseModel.findOne({ticketId});
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found." });
        }
        ticket.status = 'resolved';
        const updatedTicket = await ticket.save();
        if (updatedTicket){
            return res.status(200).json({ success: true, message: "Ticket marked as resolved." });
        }
        else{
            return res.status(500).json({ success: false, message: "Failed to update ticket status" });
        }
    } catch (err) {
        console.error('Error resolving ticket:', err);
        return res.status(500).json({ success: false, message: 'Something went wrong', error: err.message });
    }
});


module.exports = RaiseTicketsAuthRouter