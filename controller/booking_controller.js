const Booking = require("../model/booking");
const User = require("../model/user");
const Webinar = require("../model/webinar");
const nodemailer = require("nodemailer");
const BASE_URL = process.env.BASE_URL;

const findAll = async (req, res) => {
  try {
    const booking = await Booking.find().populate("userId").populate("webinarId");
    res.status(200).json(booking);
  }
  catch (e) {
    res.json(e)
  }
}

const save = async (req, res) => {
  try {
    const { webinarId } = req.body;

    const userId = req.user.id;

    const webinar = await Webinar.findById(webinarId).populate("hostId");
    if (!webinar) {
      return res.status(404).json({ message: "Webinar not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (webinar.totalSeats !== null && webinar.bookedSeats >= webinar.totalSeats) {
      return res.status(400).json({ message: "No seats available" });
    }

    webinar.bookedSeats = (webinar.bookedSeats || 0) + 1;
    await webinar.save();

    const booking = new Booking({
      userId,
      webinarId,
      webinarDetails: {
        webinarPhoto: webinar.webinarPhoto,
        title: webinar.title,
        level: webinar.level,
        language: webinar.language,
        date: webinar.date,
        startTime: webinar.startTime,
        endTime: webinar.endTime,
        webinarPhoto: webinar.webinarPhoto,
        hostFullName: webinar.hostId.fullName
      },
    });

    await booking.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      protocol: "smtp",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: '"Webinara Support" <webinara2025@gmail.com>',
      to: user.email,
      subject: "Booking Confirmation",
      html: `
                <h1>Thank you for your booking!</h1>
                <p>You have successfully booked a seat for the webinar: <strong>${booking.webinarDetails.title}</strong>.</p>
                <p><strong>Date:</strong> ${new Date(booking.webinarDetails.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${booking.webinarDetails.startTime} - ${booking.webinarDetails.endTime || 'N/A'}</p>
                <p>
                    <strong>Webinar Link:</strong> 
                    <a href="https://zoom.us/j/1234567890" target="_blank" rel="noopener noreferrer">
                    Click here to join the webinar
                    </a>
                </p>
                <p>Please join 5 minutes before the start time.</p>
                <p>Best regards,<br/>The Webinara Team</p>
            `
    });

    res.status(201).json(booking);
  } catch (e) {
    res.status(500).json({ message: "Error booking seats", error: e.message });
  }
};

const findByWebinarId = async (req, res) => {
  try {
    const { webinarId } = req.params;
    const bookings = await Booking.find({ webinarId }).populate("userId");

    const processedBookings = bookings.map((booking) => {
      const user = booking.userId;

      const profilePicURL = user?.profilePicture
        ? `${BASE_URL}/user-images/${user.profilePicture}`
        : null;

      return {
        _id: booking._id,
        webinarId: booking.webinarId,
        userId: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobileNumber: user.mobileNumber,
          address: user.address,
          city: user.city,
          profilePicture: profilePicURL,
        },
      };
    });

    res.status(200).json(processedBookings);
  } catch (e) {
    console.error("Error in findByWebinarId:", e);
    res.status(500).json({ message: "Error fetching bookings", error: e.message });
  }
};

const findUpcomingBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const upcomingBookings = await Booking.find({ userId })
      .populate({
        path: "webinarId",
        match: { date: { $gte: now } },
        populate: {
          path: "hostId", 
          select: "fullName" 
        }
      })
      .populate("userId");


    const filteredBookings = upcomingBookings.filter(pt => pt.webinarId !== null);

    const processedBookings = filteredBookings.map(booking => {
      const webinar = booking.webinarId;

      return {
        _id: booking._id,
        userId: booking.userId,
        webinarId: webinar,
        webinarDetails: {
          title: webinar.title,
          level: webinar.level,
          language: webinar.language,
          date: webinar.date,
          startTime: webinar.startTime,
          endTime: webinar.endTime,
          hostFullName: webinar.hostId.fullName,
          webinarPhoto: webinar.webinarPhoto
            ? `${BASE_URL}/webinar-images/${webinar.webinarPhoto}`
            : null,
        },
        __v: booking.__v
      };
    });

    res.status(200).json(processedBookings);
  } catch (e) {
    res.status(500).json({ message: "Error fetching upcoming bookings", error: e.message });
  }
};

const findPastBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const pastBookings = await Booking.find({ userId })
      .populate({
        path: "webinarId",
        match: { date: { $lt: now } },
        populate: {
          path: "hostId", 
          select: "fullName" 
        }
      })
      .populate("userId");

    const filteredBookings = pastBookings.filter(pt => pt.webinarId !== null);

    const processedBookings = filteredBookings.map(booking => {
      const webinar = booking.webinarId;

      return {
        _id: booking._id,
        userId: booking.userId,
        webinarId: webinar,
        webinarDetails: {
          title: webinar.title,
          level: webinar.level,
          language: webinar.language,
          date: webinar.date,
          startTime: webinar.startTime,
          endTime: webinar.endTime,
          webinarPhoto: webinar.webinarPhoto
            ? `${BASE_URL}/webinar-images/${webinar.webinarPhoto}`
            : null,
        },
        __v: booking.__v
      };
    });

    res.status(200).json(processedBookings);
  } catch (e) {
    res.status(500).json({ message: "Error fetching past bookings", error: e.message });
  }
};

const checkIfBooked = async (req, res) => {
  try {
    const userId = req.user.id;
    const { webinarId } = req.params;

    if (!webinarId) {
      return res.status(400).json({ message: "webinarId is required" });
    }

    const existingBooking = await Booking.findOne({ userId, webinarId });

    res.status(200).json({ alreadyBooked: !!existingBooking });
  } catch (e) {
    console.error("Error checking booking:", e);
    res.status(500).json({ message: "Error checking booking", error: e.message });
  }
};

module.exports = {
  findAll,
  save,
  findByWebinarId,
  findUpcomingBookings,
  findPastBookings,
  checkIfBooked
}