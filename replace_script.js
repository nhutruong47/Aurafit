const fs = require('fs');
const path = require('path');

const replacements = {
    // GlobalExceptionHandler
    "Yeu cau upload tep khong hop le.": "Yêu cầu tải lên tệp không hợp lệ.",
    "Loai noi dung khong duoc ho tro.": "Định dạng nội dung không được hỗ trợ.",

    // CustomUserDetailsService
    "Khong tim thay email: ": "Không tìm thấy email: ",
    "Tai khoan cua ban hien dang bi khoa.": "Tài khoản của bạn hiện đang bị khóa.",

    // AuthServiceImpl
    "Email nay da duoc su dung. Vui long su dung email khac.": "Email này đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.",

    // PaymentServiceImpl
    "Don hang nay khong o trang thai cho phep thanh toan. Trang thai hien tai: ": "Đơn hàng không ở trạng thái hợp lệ để thanh toán. Trạng thái hiện tại: ",

    // AuthController
    "Dang ky tai khoan thanh cong.": "Đăng ký tài khoản thành công.",
    "Gui ma OTP thanh cong.": "Gửi mã xác thực OTP thành công.",
    "Dang ky tai khoan thanh cong!": "Đăng ký tài khoản thành công!",
    "Dang nhap thanh cong.": "Đăng nhập thành công.",
    "Lam moi access token thanh cong.": "Cập nhật phiên đăng nhập thành công.",

    // UserServiceImpl
    "Sai tai khoan hoac mat khau.": "Tài khoản hoặc mật khẩu không chính xác.",
    "Phien lam viec da het han hoac khong hop le, vui long dang nhap lai.": "Phiên làm việc không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại.",
    "Ma xac thuc khong hop le, vui long dang nhap lai.": "Mã xác thực không hợp lệ, vui lòng đăng nhập lại.",
    "Khong tim thay nguoi dung hop le.": "Người dùng không tồn tại trong hệ thống.",
    "Admin chi duoc cap hoac thu hoi quyen SELLER cho tai khoan ban hang.": "Admin chỉ được cấp hoặc thu hồi quyền SELLER cho tài khoản bán hàng.",
    "Chi co the cap hoac thu hoi quyen SELLER cho tai khoan CUSTOMER/SELLER.": "Chỉ có thể thay đổi quyền SELLER cho tài khoản CUSTOMER/SELLER.",

    // UploadServiceImpl
    "Ten tep tai len khong hop le.": "Tên tệp tải lên không hợp lệ.",
    "Tep tai len khong duoc de trong.": "Vui lòng chọn tệp để tải lên.",
    "Khong the doc du lieu tep tai len.": "Không thể đọc dữ liệu từ tệp tải lên.",
    "Noi dung tep khong phai anh hop le.": "Tệp tải lên không phải là định dạng ảnh hợp lệ.",
    "Duoi tep khong khop voi noi dung anh tai len.": "Định dạng tệp không khớp với nội dung ảnh tải lên.",
    "Tai anh len Cloudinary that bai.": "Tải ảnh lên máy chủ lưu trữ thất bại.",

    // EmailServiceImpl
    "Khong the gui email xac thuc. Vui long thu lai sau.": "Không thể gửi email xác thực. Vui lòng thử lại sau.",
    "Ma xac thuc cua ban de hoan tat dang ky tai khoan AuraFit:": "Mã xác thực để hoàn tất đăng ký tài khoản AuraFit của bạn:",
    "Ma nay co hieu luc trong <strong>5 phut</strong>. Vui long khong chia se ma nay voi bat ky ai.": "Mã xác thực có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.",
    "Neu ban khong yeu cau ma xac thuc, vui long bo qua email nay.": "Nếu bạn không yêu cầu mã xác thực này, vui lòng bỏ qua email.",

    // OtpServiceImpl
    "Ban chua yeu cau ma OTP. Vui long gui lai.": "Bạn chưa yêu cầu mã xác thực OTP. Vui lòng yêu cầu lại.",
    "Ma OTP da het han (qua 5 phut). Vui long gui lai.": "Mã xác thực OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.",
    "Ma OTP khong dung. Vui long thu lai.": "Mã xác thực OTP không chính xác. Vui lòng thử lại.",

    // OrderServiceImpl
    "Danh sach mat hang thanh toan khong duoc de trong.": "Danh sách sản phẩm thanh toán không được để trống.",
    "Ngay tra (rentalEndDate) cua san pham [SKU: ": "Ngày trả (rentalEndDate) của sản phẩm [SKU: ",
    "So ngay thue phai lon hon 0 cho san pham [SKU: ": "Số ngày thuê phải lớn hơn 0 đối với sản phẩm [SKU: ",
    "Khong the huy don hang voi trang thai: ": "Không thể hủy đơn hàng đang ở trạng thái: ",
    "Khong tim thay chi tiet don hang voi ID: ": "Không tìm thấy chi tiết đơn hàng với mã ID: ",
    
    // AuthRequest & OtpRequestDTO & RegisterRequest
    "Email khong duoc de trong.": "Vui lòng cung cấp địa chỉ email.",
    "Email khong dung dinh dang.": "Địa chỉ email không đúng định dạng.",
    "Mat khau khong duoc de trong.": "Vui lòng nhập mật khẩu.",
    "Mat khau phai co it nhat 6 ky tu.": "Mật khẩu phải chứa ít nhất 6 ký tự.",
    "Ho ten khong duoc de trong.": "Vui lòng nhập họ tên.",
    "So dien thoai khong duoc de trong.": "Vui lòng cung cấp số điện thoại.",
    "Phien lam viec da het han, vui long dang nhap lai.": "Phiên làm việc đã hết hạn, vui lòng đăng nhập lại."
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./backend/src/main/java', function(filePath) {
    if (filePath.endsWith('.java')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        for (const [key, value] of Object.entries(replacements)) {
            // Use split and join for exact match replacement
            content = content.split('"' + key + '"').join('"' + value + '"');
        }
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated: ' + filePath);
        }
    }
});

