const fs = require('fs');
const path = require('path');

const replacements = {
    // Auth & Accounts
    "Không thể tải chi tiết đơn hàng vừa tạo.": "Hệ thống không thể truy xuất thông tin chi tiết đơn hàng vừa tạo.",
    "Họ tên không được để trống.": "Quý khách vui lòng cung cấp họ và tên.",
    "Lỗi cập nhật hồ sơ.": "Hệ thống gặp sự cố khi cập nhật hồ sơ.",
    "Mật khẩu mới phải có ít nhất 6 ký tự.": "Mật khẩu bảo mật cần chứa ít nhất 6 ký tự.",
    "Mật khẩu xác nhận không khớp.": "Mật khẩu xác nhận không trùng khớp.",
    "Lỗi đổi mật khẩu.": "Hệ thống gặp sự cố khi thay đổi mật khẩu.",
    "Không thể đăng nhập. Vui lòng thử lại.": "Đăng nhập không thành công. Quý khách vui lòng thử lại.",
    "Không thể hoàn tất đăng ký. Vui lòng thử lại.": "Đăng ký không thành công. Quý khách vui lòng thử lại.",
    "Đăng ký thành công nhưng bạn chưa được đăng nhập tự động. Vui lòng đăng nhập lại.": "Đăng ký thành công. Quý khách vui lòng đăng nhập lại để tiếp tục.",
    "Mã xác thực đã được gửi đến email của bạn": "Mã xác thực OTP đã được gửi đến email của Quý khách",
    "Yêu cầu đăng ký đã được ghi nhận. Mã OTP đã được gửi tới": "Yêu cầu đăng ký đã được tiếp nhận. Mã xác thực OTP đã được gửi tới",
    "Vui lòng kiểm tra hộp thư và nhập mã để kích hoạt tài khoản.": "Quý khách vui lòng kiểm tra hộp thư và nhập mã để kích hoạt tài khoản.",
    "Không thể đăng ký và gửi mã OTP. Vui lòng thử lại.": "Hệ thống gặp sự cố khi xử lý đăng ký. Quý khách vui lòng thử lại.",
    "Mã OTP đã được gửi lại. Vui lòng kiểm tra email của bạn.": "Mã xác thực OTP đã được gửi lại. Quý khách vui lòng kiểm tra hộp thư.",
    "Không thể gửi lại mã OTP.": "Hệ thống không thể gửi lại mã xác thực OTP.",
    "Vui lòng nhập đủ 6 chữ số của mã OTP.": "Quý khách vui lòng nhập đầy đủ 6 chữ số của mã xác thực OTP.",
    "Đang xử lý...": "Đang xử lý yêu cầu...",

    // Admin & Staff
    "Không thể tải danh sách danh mục.": "Hệ thống không thể truy xuất danh sách danh mục.",
    "Không thể lưu danh mục.": "Hệ thống gặp sự cố khi lưu thông tin danh mục.",
    "Không thể xóa danh mục.": "Hệ thống gặp sự cố khi xóa danh mục.",
    "Không thể tải danh sách đơn.": "Hệ thống không thể truy xuất danh sách đơn hàng.",
    "Không thể tải chi tiết đơn.": "Hệ thống không thể truy xuất chi tiết đơn hàng.",
    "Không thể lưu biên bản.": "Hệ thống gặp sự cố khi lưu biên bản.",
    "Không thể tải chi tiết đơn hàng.": "Hệ thống không thể truy xuất chi tiết đơn hàng.",
    "Không thể tải danh sách lịch sử đơn hàng.": "Hệ thống không thể truy xuất danh sách lịch sử đơn hàng.",
    "Không thể tải danh sách tài khoản.": "Hệ thống không thể truy xuất danh sách tài khoản.",
    "Không thể cập nhật quyền tài khoản.": "Hệ thống gặp sự cố khi cập nhật phân quyền tài khoản.",
    "Không thể tạo tài khoản staff.": "Hệ thống gặp sự cố khi khởi tạo tài khoản nhân viên.",
    "Không thể tải dữ liệu shop chung.": "Hệ thống không thể truy xuất dữ liệu cửa hàng.",
    "Không thể tải dữ liệu sản phẩm.": "Hệ thống không thể truy xuất dữ liệu sản phẩm.",

    // Image Upload
    "Tệp ảnh không hợp lệ.": "Tệp hình ảnh không hợp lệ.",
    "Vui lòng chọn ảnh trước khi tải lên.": "Quý khách vui lòng chọn tệp hình ảnh trước khi tải lên.",
    "Không thể tải ảnh lên.": "Hệ thống không thể tải hình ảnh lên máy chủ."
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

walkDir('./frontend/src', function(filePath) {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        for (const [key, value] of Object.entries(replacements)) {
            content = content.split("'" + key + "'").join("'" + value + "'");
            content = content.split('"' + key + '"').join('"' + value + '"');
            content = content.split('`' + key + '`').join('`' + value + '`');
        }
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated: ' + filePath);
        }
    }
});
