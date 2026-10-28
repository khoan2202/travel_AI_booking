// server/src/docs/openapi.js
// Tài liệu cho 29 API hiện có của Travel Mint.
// File này chỉ mô tả API, không thay đổi xử lý backend.

// ======================================================
// 1. Hàm hỗ trợ tạo cấu trúc tài liệu dùng chung
// ======================================================

const str = (extra = {}) => ({ type: "string", ...extra });
const int = (extra = {}) => ({ type: "integer", ...extra });
const bool = () => ({ type: "boolean" });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const arr = (items) => ({ type: "array", items });

const obj = (properties, required = []) => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
});

const id = () => int({ minimum: 1, maximum: 2147483647 });
const date = () => str({ format: "date", example: "2026-12-20" });
const timestamp = () => str({ format: "date-time" });

// PostgreSQL NUMERIC được backend hiện tại trả về dạng chuỗi.
const money = () =>
  str({
    description: "Số tiền VND, trả về dạng chuỗi từ PostgreSQL.",
    example: "3400000",
  });

const enumString = (values) => str({ enum: values });

const inputInteger = (min, max) => ({
  description: `Số nguyên từ ${min} đến ${max}; backend chấp nhận số hoặc chuỗi chữ số.`,
  oneOf: [int({ minimum: min, maximum: max }), str({ pattern: "^\\d+$" })],
});

const dataResponse = (schema) => obj({ data: schema }, ["data"]);

const messageDataResponse = (schema) =>
  obj({ message: str(), data: schema }, ["message", "data"]);

const jsonResponse = (description, schema) => ({
  description,
  content: {
    "application/json": { schema },
  },
});

const body = (schema) => ({
  required: true,
  content: {
    "application/json": { schema },
  },
});

const query = (name, schema, description) => ({
  name,
  in: "query",
  required: false,
  description,
  schema,
});

const pathId = {
  name: "id",
  in: "path",
  required: true,
  description: "ID của đối tượng cần thao tác.",
  schema: id(),
};

const pageQuery = query(
  "page",
  int({ minimum: 1, maximum: 1000000, default: 1 }),
  "Trang cần lấy.",
);

const searchQuery = query(
  "q",
  str({ maxLength: 100 }),
  "Từ khóa tìm kiếm; bỏ qua nếu muốn lấy tất cả.",
);

const errorDescriptions = {
  400: "Dữ liệu hoặc tham số không hợp lệ.",
  401: "Chưa đăng nhập hoặc phiên đăng nhập không còn hợp lệ.",
  403: "Không có quyền, hoặc CSRF token / nguồn gửi không hợp lệ.",
  404: "Không tìm thấy dữ liệu phù hợp.",
  409: "Xung đột dữ liệu hoặc trạng thái hiện tại.",
  413: "Nội dung JSON vượt giới hạn 32 KB.",
  429: "Vượt giới hạn số lần gửi yêu cầu.",
  500: "Có lỗi phía máy chủ.",
  503: "Hệ thống đang bận hoặc dịch vụ chưa sẵn sàng.",
};

function errors(codes, schemaName = "Error") {
  return Object.fromEntries(
    codes.map((code) => [
      code,
      jsonResponse(errorDescriptions[code], ref(schemaName)),
    ]),
  );
}

const sessionSecurity = [{ sessionCookie: [] }];
const csrfSecurity = [{ csrfToken: [] }];

// Cả cookie phiên VÀ CSRF đều cần thiết.
const sessionCsrfSecurity = [{ sessionCookie: [], csrfToken: [] }];

function operation({
  tag,
  summary,
  description = "",
  security = [],
  parameters = [],
  input,
  output,
  status = 200,
  errorCodes = [500],
  extraResponses = {},
}) {
  return {
    tags: [tag],
    summary,
    description,
    security,
    ...(parameters.length ? { parameters } : {}),
    ...(input ? { requestBody: body(input) } : {}),
    responses: {
      [status]: jsonResponse(
        status === 201 ? "Tạo mới thành công." : "Thành công.",
        output,
      ),
      ...errors(errorCodes),
      ...extraResponses,
    },
  };
}

function adminOperation(options) {
  const write = options.write === true;
  const { write: _write, ...rest } = options;

  return operation({
    ...rest,
    tag: "Admin",
    description:
      "Yêu cầu đăng nhập bằng tài khoản có role admin. " +
      (options.description || ""),
    security: write ? sessionCsrfSecurity : sessionSecurity,
  });
}

// ======================================================
// 2. Các trường dữ liệu dùng chung khi thực sự giống nhau
// ======================================================

const userFields = {
  id: id(),
  name: str(),
  email: str({ format: "email" }),
  role: enumString(["user", "admin"]),
};

const tourFields = {
  id: id(),
  title: str(),
  slug: str(),
  description: str(),
  duration_days: int(),
  departure_location: str(),
  image_url: str({ nullable: true }),
  tags: arr(str()),
};

const bookingFields = {
  id: id(),
  departure_id: id(),
  tour_id: id(),
  guest_count: int({ minimum: 1, maximum: 20 }),
  unit_price: money(),
  total_price: money(),
  tour_title: str(),
  departure_date: date(),
  contact_name: str(),
  contact_email: str({ format: "email" }),
  contact_phone: str(),
  notes: str(),
  status: enumString(["confirmed", "cancelled"]),
  payment_status: enumString(["unpaid", "paid", "refunded"]),
  created_at: timestamp(),
  cancelled_at: { ...timestamp(), nullable: true },
  can_cancel: bool(),
};

const adminTourFields = {
  ...tourFields,
  destination_id: id(),
  status: enumString(["draft", "active", "archived"]),
  created_at: timestamp(),
};

const recommendationFields = {
  id: id(),
  title: str(),
  duration_days: int(),
  departure_location: str(),
  image_url: str({ nullable: true }),
  tags: arr(str()),
  destination: str(),
  region: str(),
  departure_id: id(),
  start_date: date(),
  price_from: money(),
  seats_left: int(),
  summary: str({ maxLength: 650 }),
};

const filterInputFields = {
  budget: {
    ...inputInteger(1, 999999999999),
    description:
      "Ngân sách tối đa VND/người. Bỏ qua để không giới hạn; backend cũng chấp nhận null hoặc chuỗi rỗng.",
  },
  days: {
    ...inputInteger(1, 60),
    description:
      "Số ngày tối đa. Bỏ qua để không giới hạn; backend cũng chấp nhận null hoặc chuỗi rỗng.",
  },
  guests: {
    ...inputInteger(1, 20),
    description: "Số người; mặc định 1 khi không cung cấp.",
  },
  region: str({ maxLength: 50 }),
  interest: str({ maxLength: 30 }),
};

const recommendationQueries = [
  query(
    "budget",
    int({ minimum: 1, maximum: 999999999999 }),
    "Ngân sách tối đa VND/người; bỏ qua để không giới hạn.",
  ),
  query("days", int({ minimum: 1, maximum: 60 }), "Số ngày tối đa."),
  query(
    "guests",
    int({ minimum: 1, maximum: 20, default: 1 }),
    "Số khách cần đủ chỗ.",
  ),
  query("region", str({ maxLength: 50 }), "Khu vực."),
  query("interest", str({ maxLength: 30 }), "Tag sở thích."),
];

const adminTourInputFields = {
  destination_id: inputInteger(1, 2147483647),
  title: str({ minLength: 5, maxLength: 200 }),
  slug: str({
    minLength: 2,
    maxLength: 220,
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
  }),
  description: str({ minLength: 20, maxLength: 5000 }),
  duration_days: inputInteger(1, 60),
  departure_location: str({ minLength: 2, maxLength: 100 }),
  image_url: str({
    maxLength: 2000,
    description: "URL HTTPS hợp lệ hoặc chuỗi rỗng; có thể bỏ qua.",
  }),
  tags: {
    type: "array",
    maxItems: 10,
    items: str({ minLength: 1, maxLength: 30 }),
    description: "Tag không được chỉ chứa khoảng trắng.",
  },
  status: enumString(["draft", "active", "archived"]),
};

const departureInputFields = {
  start_date: date(),
  price_per_person: inputInteger(1, 999999999999),
  capacity: inputInteger(1, 500),
  status: enumString(["scheduled", "cancelled", "completed"]),
};

function adminPage(itemSchema) {
  return dataResponse(
    obj({
      items: arr(itemSchema),
      page: int(),
      total_pages: int(),
      total: int(),
    }),
  );
}

// ======================================================
// 3. Định nghĩa OpenAPI
// ======================================================

const openapi = {
  openapi: "3.0.3",

  info: {
    title: "Travel Mint API",
    version: "1.0.0",
    description: [
      "Tài liệu 29 API của Travel Mint.",
      "",
      "Xác thực bằng cookie phiên travel.sid, không dùng Bearer token.",
      "Trước khi gửi POST: gọi GET /auth/csrf, giữ cookie phiên,",
      "rồi gửi token qua header X-CSRF-Token.",
      "Sau khi đăng nhập, lấy lại token vì phiên đã được tạo mới.",
      "",
      "Cookie HttpOnly do trình duyệt quản lý; không nhập mật khẩu vào ô Authorize.",
      "Origin của yêu cầu phải thuộc danh sách backend cho phép.",
      "",
      "Các API Admin yêu cầu role admin.",
      "JSON gửi lên backend có giới hạn 32 KB.",
      "Các trường tiền NUMERIC từ PostgreSQL được trả về dạng chuỗi.",
      "",
      "Swagger hiện chỉ bật Try it out cho GET theo cấu hình app.js.",
      "Các ví dụ trong tài liệu không phải dữ liệu thật trong database.",
    ].join("\n"),
  },

  servers: [{ url: "/api", description: "API trên máy chủ hiện tại" }],

  tags: [
    { name: "Health", description: "Kiểm tra backend và database" },
    { name: "Auth", description: "Tài khoản và phiên đăng nhập" },
    { name: "Tours", description: "Tour và lịch khởi hành công khai" },
    { name: "Bookings", description: "Đơn đặt tour của khách hàng" },
    { name: "Recommendations", description: "Lọc tour và tư vấn AI" },
    { name: "Admin", description: "Quản trị; yêu cầu role admin" },
    { name: "Support", description: "Liên hệ và hỗ trợ" },
  ],

  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "travel.sid",
        description: "Cookie HttpOnly do backend cấp. Trình duyệt tự quản lý.",
      },
      csrfToken: {
        type: "apiKey",
        in: "header",
        name: "X-CSRF-Token",
        description:
          "Token từ GET /auth/csrf; phải gửi cùng cookie phiên tương ứng.",
      },
    },

    schemas: {
      Error: obj({ message: str() }, ["message"]),

      BookingError: obj(
        {
          message: str(),
          code: str({
            description: "Có trong các lỗi nghiệp vụ đặt tour.",
            enum: [
              "INVALID_BOOKING",
              "NOT_FOUND",
              "REQUEST_CHANGED",
              "DEPARTURE_CLOSED",
              "INSUFFICIENT_SEATS",
              "PRICE_CHANGED",
              "CANNOT_CANCEL",
              "RETRY_BOOKING",
            ],
          }),
        },
        ["message"],
      ),

      User: obj(userFields, ["id", "name", "email", "role"]),

      RegisterInput: obj(
        {
          name: str({ minLength: 2, maxLength: 100 }),
          email: str({
            format: "email",
            maxLength: 254,
            example: "demo@example.com",
          }),
          password: str({
            format: "password",
            writeOnly: true,
            minLength: 10,
            description:
              "Tối thiểu 10 ký tự theo backend; tối đa 72 byte UTF-8.",
          }),
        },
        ["name", "email", "password"],
      ),

      LoginInput: obj(
        {
          email: str({ format: "email", maxLength: 254 }),
          password: str({
            format: "password",
            writeOnly: true,
            minLength: 1,
            description: "Mật khẩu hiện tại; tối đa 72 byte UTF-8.",
          }),
        },
        ["email", "password"],
      ),

      AuthSuccess: messageDataResponse(obj({ user: ref("User") }, ["user"])),

      CurrentUserResponse: dataResponse(obj({ user: ref("User") }, ["user"])),

      // Danh sách tour có available_departures.
      PublicTourListItem: obj({
        ...tourFields,
        destination: str(),
        region: str(),
        price_from: money(),
        available_departures: int(),
      }),

      // Chi tiết tour không có available_departures.
      // price_from có thể null nếu không còn lịch khả dụng.
      PublicTourDetail: obj({
        ...tourFields,
        destination: str(),
        region: str(),
        price_from: { ...money(), nullable: true },
      }),

      PublicDeparture: obj({
        id: id(),
        tour_id: id(),
        start_date: date(),
        price_per_person: money(),
        available_seats: int(),
      }),

      Booking: obj(bookingFields),

      BookingInput: obj(
        {
          departure_id: id(),
          guest_count: int({ minimum: 1, maximum: 20 }),
          expected_unit_price: {
            ...inputInteger(1, 999999999999),
            description:
              "Giá mỗi người khách vừa xem. Backend đối chiếu với giá thật trong database.",
            example: "3400000",
          },
          contact_name: str({ minLength: 2, maxLength: 100 }),
          contact_phone: str({
            maxLength: 30,
            description:
              "Sau khi bỏ khoảng trắng, dấu ngoặc, chấm và gạch ngang: 9–15 chữ số, có thể có + ở đầu.",
            example: "0900000000",
          }),
          notes: str({ maxLength: 500 }),
          request_key: str({
            format: "uuid",
            description:
              "UUID v4. Giữ cùng mã và cùng nội dung khi thử lại một yêu cầu chưa rõ kết quả.",
            example: "f3a74b9e-8d21-4c66-a852-6e0d7a9c1234",
          }),
        },
        [
          "departure_id",
          "guest_count",
          "expected_unit_price",
          "contact_name",
          "contact_phone",
          "request_key",
        ],
      ),

      BookingMutationResponse: dataResponse(
        obj({
          booking: ref("Booking"),
          replayed: bool(),
        }),
      ),

      MyBookingsResponse: dataResponse(
        obj({
          items: arr(ref("Booking")),
          page: int(),
          page_size: int({ enum: [10] }),
          total: int(),
          total_pages: int(),
        }),
      ),

      RecommendationFiltersInput: obj(filterInputFields),

      RecommendationFilters: obj({
        budget: int({ nullable: true }),
        days: int({ nullable: true }),
        guests: int(),
        region: str(),
        interest: str(),
      }),

      RecommendedTour: obj(recommendationFields),

      ConsultedTour: obj({
        ...recommendationFields,
        reason: str(),
      }),

      ConsultationInput: obj(
        {
          message: str({ minLength: 3, maxLength: 1200 }),
          filters: ref("RecommendationFiltersInput"),
          history: {
            type: "array",
            maxItems: 4,
            items: obj(
              {
                role: enumString(["user", "assistant"]),
                text: str({ maxLength: 700 }),
              },
              ["role", "text"],
            ),
          },
        },
        ["message"],
      ),

      ConsultationResponse: dataResponse(
        obj({
          source: enumString(["gemini", "database"]),
          answer: str(),
          recommendations: {
            type: "array",
            maxItems: 3,
            items: ref("ConsultedTour"),
          },
        }),
      ),

      Destination: obj({
        id: id(),
        name: str(),
        slug: str(),
        region: str(),
      }),

      DestinationInput: obj(
        {
          name: str({ minLength: 2, maxLength: 100 }),
          slug: str({
            minLength: 2,
            maxLength: 120,
            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
          }),
          region: str({ minLength: 2, maxLength: 50 }),
        },
        ["name", "slug", "region"],
      ),

      // Tạo/cập nhật tour trả hàng dữ liệu bảng tours.
      AdminTour: obj(adminTourFields),

      // Danh sách admin còn JOIN thêm destination và region.
      AdminTourListItem: obj({
        ...adminTourFields,
        destination: str(),
        region: str(),
      }),

      AdminTourInput: obj(adminTourInputFields, [
        "destination_id",
        "title",
        "slug",
        "description",
        "duration_days",
        "departure_location",
        "tags",
        "status",
      ]),

      AdminDeparture: obj({
        id: id(),
        tour_id: id(),
        start_date: date(),
        price_per_person: money(),
        capacity: int(),
        seats_booked: int(),
        status: enumString(["scheduled", "cancelled", "completed"]),
      }),

      CreateDepartureInput: obj(
        {
          ...departureInputFields,
          status: enumString(["scheduled"]),
        },
        ["start_date", "price_per_person", "capacity", "status"],
      ),

      UpdateDepartureInput: obj(departureInputFields, [
        "start_date",
        "price_per_person",
        "capacity",
        "status",
      ]),

      AdminBookingListItem: obj({
        ...bookingFields,
        user_id: id(),
      }),

      AdminBookingDetail: obj({
        ...bookingFields,
        user_id: id(),
        user_email: str({ format: "email" }),
      }),

      PaymentEvent: obj({
        id: str({
          description: "ID BIGINT được pg trả về dạng chuỗi.",
        }),
        kind: enumString(["payment", "refund"]),
        amount: money(),
        reference: str(),
        note: str(),
        created_at: timestamp(),
      }),

      AuditLog: obj({
        action: str(),
        details: {
          type: "object",
          additionalProperties: true,
          description: "Thông tin JSON của thao tác quản trị.",
        },
        created_at: timestamp(),
      }),

      AdminBookingActionInput: {
        description:
          "Chọn đúng một thao tác. mark_paid và refund_cancel cần reference; cancel_unpaid không cần.",
        oneOf: [
          obj(
            {
              action: enumString(["mark_paid"]),
              confirmed: { type: "boolean", enum: [true] },
              note: str({ minLength: 5, maxLength: 500 }),
              reference: str({ minLength: 4, maxLength: 120 }),
            },
            ["action", "confirmed", "note", "reference"],
          ),
          obj(
            {
              action: enumString(["cancel_unpaid"]),
              confirmed: { type: "boolean", enum: [true] },
              note: str({ minLength: 5, maxLength: 500 }),
            },
            ["action", "confirmed", "note"],
          ),
          obj(
            {
              action: enumString(["refund_cancel"]),
              confirmed: { type: "boolean", enum: [true] },
              note: str({ minLength: 5, maxLength: 500 }),
              reference: str({ minLength: 4, maxLength: 120 }),
            },
            ["action", "confirmed", "note", "reference"],
          ),
        ],
      },

      SupportInput: obj(
        {
          full_name: str({ minLength: 2, maxLength: 100 }),
          phone: str({
            description:
              "Sau khi bỏ khoảng trắng, chấm và gạch ngang: 9–15 chữ số, có thể có + ở đầu.",
            example: "0900000000",
          }),
          booking_id: {
            ...id(),
            nullable: true,
            description:
              "Có thể bỏ qua hoặc null. Nếu có ID, phải đăng nhập và đơn phải thuộc tài khoản hiện tại.",
          },
          message: str({
            minLength: 10,
            maxLength: 3000,
            example: "Tôi muốn được tư vấn thêm về lịch khởi hành.",
          }),
        },
        ["full_name", "phone", "message"],
      ),

      SupportResponse: messageDataResponse(
        obj({
          id: id(),
          status: enumString(["pending"]),
          created_at: timestamp(),
        }),
      ),
    },
  },

  paths: {
    // ==================================================
    // HEALTH — 1 API
    // ==================================================

    "/health": {
      get: operation({
        tag: "Health",
        summary: "Kiểm tra backend và PostgreSQL",
        description: "Backend thực hiện SELECT 1 để kiểm tra database.",
        output: obj({
          message: str({ example: "Backend đang chạy" }),
          database: str({ example: "PostgreSQL đã kết nối" }),
        }),
        errorCodes: [],
        extraResponses: {
          503: jsonResponse("Không kết nối được PostgreSQL.", ref("Error")),
        },
      }),
    },

    // ==================================================
    // AUTH — 5 API
    // ==================================================

    "/auth/csrf": {
      get: operation({
        tag: "Auth",
        summary: "Lấy CSRF token",
        description:
          "Không cần đăng nhập. Giữ cookie phiên tương ứng với token. " +
          "Sau khi đăng nhập thành công, cần lấy lại token.",
        output: dataResponse(
          obj({
            csrfToken: str({
              description: "Token hex 64 ký tự.",
            }),
          }),
        ),
      }),
    },

    "/auth/register": {
      post: operation({
        tag: "Auth",
        summary: "Đăng ký",
        description:
          "Tạo tài khoản role user; không tự đăng nhập. " +
          "Tên được trim; email được trim và chuyển thành chữ thường. " +
          "Giới hạn 10 yêu cầu/giờ/IP.",
        security: csrfSecurity,
        input: ref("RegisterInput"),
        output: ref("AuthSuccess"),
        status: 201,
        errorCodes: [400, 403, 409, 413, 429, 500],
      }),
    },

    "/auth/login": {
      post: operation({
        tag: "Auth",
        summary: "Đăng nhập",
        description:
          "Tạo phiên mới và cookie travel.sid khi thành công. " +
          "Giới hạn 10 lần thất bại/15 phút/IP.",
        security: csrfSecurity,
        input: ref("LoginInput"),
        output: ref("AuthSuccess"),
        errorCodes: [400, 401, 403, 413, 429, 500],
      }),
    },

    "/auth/me": {
      get: operation({
        tag: "Auth",
        summary: "Xem tài khoản hiện tại",
        security: sessionSecurity,
        output: ref("CurrentUserResponse"),
        errorCodes: [401, 500],
      }),
    },

    "/auth/logout": {
      post: operation({
        tag: "Auth",
        summary: "Đăng xuất",
        description:
          "Hủy phiên và xóa cookie. Route yêu cầu CSRF, không gắn requireAuth.",
        security: csrfSecurity,
        output: obj({
          message: str({ example: "Đã đăng xuất" }),
          data: {
            nullable: true,
            enum: [null],
            example: null,
            description: "Luôn là null.",
          },
        }),
        errorCodes: [403, 413, 500],
      }),
    },

    // ==================================================
    // TOURS — 3 API
    // ==================================================

    "/tours": {
      get: operation({
        tag: "Tours",
        summary: "Danh sách tour đang mở bán",
        description:
          "Chỉ lấy tour active có lịch scheduled trong tương lai và còn chỗ. " +
          "Route này không có phân trang hay bộ lọc query.",
        output: obj({
          message: str(),
          total: int(),
          data: arr(ref("PublicTourListItem")),
        }),
      }),
    },

    "/tours/{id}": {
      get: operation({
        tag: "Tours",
        summary: "Chi tiết tour",
        parameters: [pathId],
        description:
          "Chỉ lấy tour active. price_from có thể null nếu không còn lịch khả dụng.",
        output: messageDataResponse(ref("PublicTourDetail")),
        errorCodes: [400, 404, 500],
      }),
    },

    "/tours/{id}/departures": {
      get: operation({
        tag: "Tours",
        summary: "Lịch khởi hành còn chỗ của tour",
        parameters: [pathId],
        description:
          "Lịch scheduled sau ngày hiện tại, còn chỗ, sắp xếp ngày tăng dần. " +
          "Tour không tồn tại/không active trả 404; tour hợp lệ nhưng hết lịch trả mảng rỗng.",
        output: obj({
          message: str(),
          total: int(),
          data: arr(ref("PublicDeparture")),
        }),
        errorCodes: [400, 404, 500],
      }),
    },

    // ==================================================
    // BOOKINGS — 4 API
    // ==================================================

    "/bookings": {
      get: operation({
        tag: "Bookings",
        summary: "Danh sách đơn của tôi",
        security: sessionSecurity,
        parameters: [pageQuery],
        description:
          "Chỉ trả đơn thuộc tài khoản hiện tại. Mỗi trang 10 đơn, mới nhất trước.",
        output: ref("MyBookingsResponse"),
        errorCodes: [400, 401, 500],
      }),

      post: operation({
        tag: "Bookings",
        summary: "Tạo đơn đặt tour",
        security: sessionCsrfSecurity,
        input: ref("BookingInput"),
        output: ref("BookingMutationResponse"),
        status: 201,
        description:
          "Giá thật được đọc từ database; email liên hệ lấy từ tài khoản. " +
          "Backend không tin user_id, role hoặc total_price do client gửi. " +
          "Cùng request_key và cùng nội dung sẽ trả đơn cũ, không tạo thêm đơn. " +
          "201: tạo mới, replayed=false. 200: gửi lại, replayed=true. " +
          "Giới hạn ghi dữ liệu booking: 60 yêu cầu/15 phút/IP. " +
          "Lỗi 409 có thể là REQUEST_CHANGED, DEPARTURE_CLOSED, " +
          "INSUFFICIENT_SEATS hoặc PRICE_CHANGED.",
        errorCodes: [401, 403, 413, 429, 500],
        extraResponses: {
          200: jsonResponse(
            "Yêu cầu đã được xử lý trước đó; trả lại đơn cũ.",
            ref("BookingMutationResponse"),
          ),
          ...errors([400, 404, 409, 503], "BookingError"),
        },
      }),
    },

    "/bookings/{id}": {
      get: operation({
        tag: "Bookings",
        summary: "Chi tiết đơn của tôi",
        security: sessionSecurity,
        parameters: [pathId],
        description:
          "Đơn không tồn tại hoặc không thuộc tài khoản hiện tại đều trả 404.",
        output: dataResponse(ref("Booking")),
        errorCodes: [400, 401, 404, 500],
      }),
    },

    "/bookings/{id}/cancel": {
      post: operation({
        tag: "Bookings",
        summary: "Hủy đơn của tôi",
        security: sessionCsrfSecurity,
        parameters: [pathId],
        description:
          "Không cần body. Chỉ hủy đơn chưa thanh toán và chưa đến ngày khởi hành. " +
          "Đơn đã hủy trả replayed=true. Không trả chỗ hai lần. " +
          "Lỗi 409: CANNOT_CANCEL. Giới hạn 60 yêu cầu ghi booking/15 phút/IP.",
        output: ref("BookingMutationResponse"),
        errorCodes: [401, 403, 413, 429, 500],
        extraResponses: errors([400, 404, 409, 503], "BookingError"),
      }),
    },

    // ==================================================
    // RECOMMENDATIONS — 3 API
    // ==================================================

    "/recommendations/options": {
      get: operation({
        tag: "Recommendations",
        summary: "Các khu vực và sở thích để lọc tour",
        output: dataResponse(
          obj({
            regions: arr(str()),
            interests: arr(str()),
          }),
        ),
        errorCodes: [400, 409, 500, 503],
      }),
    },

    "/recommendations": {
      get: operation({
        tag: "Recommendations",
        summary: "Gợi ý tour theo bộ lọc",
        parameters: recommendationQueries,
        description:
          "Tối đa 12 tour active có lịch tương lai đủ chỗ. " +
          "Mỗi tour chọn lịch phù hợp rẻ nhất. Ngân sách tính theo người.",
        output: dataResponse(
          obj({
            filters: ref("RecommendationFilters"),
            items: {
              type: "array",
              maxItems: 12,
              items: ref("RecommendedTour"),
            },
          }),
        ),
        errorCodes: [400, 409, 500, 503],
      }),
    },

    "/recommendations/consult": {
      post: operation({
        tag: "Recommendations",
        summary: "Tư vấn tour bằng AI",
        security: sessionCsrfSecurity,
        input: ref("ConsultationInput"),
        output: ref("ConsultationResponse"),
        description:
          "Tối đa 4 tin nhắn lịch sử; tối đa 3 tour gợi ý. " +
          "Nếu Gemini chưa sẵn sàng, backend có thể trả 200 với source=database. " +
          "Không tạo đơn hoặc thanh toán qua API tư vấn. " +
          "Giới hạn 30 yêu cầu/10 phút/IP và 10 yêu cầu/10 phút/tài khoản.",
        errorCodes: [400, 401, 403, 409, 413, 429, 500, 503],
      }),
    },

    // ==================================================
    // ADMIN — 12 API
    // ==================================================

    "/admin/overview": {
      get: adminOperation({
        summary: "Thống kê tổng quan quản trị",
        output: dataResponse(
          obj({
            users_count: int(),
            active_tours_count: int(),
            available_departures_count: int(),
            confirmed_bookings_count: int(),
            cancelled_bookings_count: int(),
            received_amount: money(),
          }),
        ),
        description: "received_amount là tổng tiền các đơn confirmed và paid.",
        errorCodes: [401, 403, 500],
      }),
    },

    "/admin/destinations": {
      get: adminOperation({
        summary: "Danh sách điểm đến",
        output: dataResponse(arr(ref("Destination"))),
        errorCodes: [401, 403, 500, 503],
      }),

      post: adminOperation({
        write: true,
        summary: "Tạo điểm đến",
        input: ref("DestinationInput"),
        output: dataResponse(ref("Destination")),
        status: 201,
        errorCodes: [400, 401, 403, 409, 413, 500, 503],
      }),
    },

    "/admin/tours": {
      get: adminOperation({
        summary: "Danh sách tour quản trị",
        parameters: [pageQuery, searchQuery],
        description:
          "20 tour/trang. Tìm theo tên tour hoặc điểm đến; gồm các trạng thái tour.",
        output: adminPage(ref("AdminTourListItem")),
        errorCodes: [400, 401, 403, 500, 503],
      }),

      post: adminOperation({
        write: true,
        summary: "Tạo tour",
        input: ref("AdminTourInput"),
        output: dataResponse(ref("AdminTour")),
        status: 201,
        errorCodes: [400, 401, 403, 409, 413, 500, 503],
      }),
    },

    "/admin/tours/{id}/update": {
      post: adminOperation({
        write: true,
        summary: "Cập nhật tour",
        parameters: [pathId],
        description:
          "Gửi đầy đủ các trường bắt buộc của AdminTourInput; không phải cập nhật từng trường kiểu PATCH.",
        input: ref("AdminTourInput"),
        output: dataResponse(ref("AdminTour")),
        errorCodes: [400, 401, 403, 404, 409, 413, 500, 503],
      }),
    },

    "/admin/tours/{id}/departures": {
      get: adminOperation({
        summary: "Danh sách lịch khởi hành quản trị",
        parameters: [pathId],
        description:
          "Lấy các lịch của tour ở mọi trạng thái, ngày mới nhất trước. " +
          "ID hợp lệ nhưng không có lịch trả mảng rỗng.",
        output: dataResponse(arr(ref("AdminDeparture"))),
        errorCodes: [400, 401, 403, 500, 503],
      }),

      post: adminOperation({
        write: true,
        summary: "Tạo lịch khởi hành",
        parameters: [pathId],
        description:
          "Ngày phải sau hôm nay và status phải là scheduled. " +
          "Không trùng ngày khởi hành trong cùng tour. Kết quả chỉ trả ID lịch.",
        input: ref("CreateDepartureInput"),
        output: dataResponse(obj({ id: id() })),
        status: 201,
        errorCodes: [400, 401, 403, 404, 409, 413, 500, 503],
      }),
    },

    "/admin/departures/{id}/update": {
      post: adminOperation({
        write: true,
        summary: "Cập nhật lịch khởi hành",
        parameters: [pathId],
        description:
          "Gửi đủ ngày, giá, sức chứa và trạng thái. " +
          "Sức chứa không được thấp hơn số chỗ đã đặt. " +
          "Lịch có chỗ đã đặt không được đổi ngày hoặc chuyển cancelled. " +
          "Không đánh dấu completed cho lịch còn ở tương lai. " +
          "Ngày mới của lịch scheduled phải sau hôm nay.",
        input: ref("UpdateDepartureInput"),
        output: dataResponse(obj({ id: id() })),
        errorCodes: [400, 401, 403, 404, 409, 413, 500, 503],
      }),
    },

    "/admin/bookings": {
      get: adminOperation({
        summary: "Danh sách đơn quản trị",
        parameters: [
          pageQuery,
          searchQuery,
          query(
            "status",
            enumString(["", "confirmed", "cancelled"]),
            "Trạng thái đơn; bỏ qua hoặc để rỗng để lấy tất cả.",
          ),
          query(
            "payment",
            enumString(["", "unpaid", "paid", "refunded"]),
            "Trạng thái thanh toán.",
          ),
        ],
        description:
          "20 đơn/trang. Tìm theo tên liên hệ, email, tên tour hoặc mã đơn TM.",
        output: adminPage(ref("AdminBookingListItem")),
        errorCodes: [400, 401, 403, 500, 503],
      }),
    },

    "/admin/bookings/{id}": {
      get: adminOperation({
        summary: "Chi tiết đơn, thanh toán và lịch sử quản trị",
        parameters: [pathId],
        output: dataResponse(
          obj({
            booking: ref("AdminBookingDetail"),
            events: arr(ref("PaymentEvent")),
            logs: {
              type: "array",
              maxItems: 30,
              items: ref("AuditLog"),
            },
          }),
        ),
        errorCodes: [400, 401, 403, 404, 500, 503],
      }),
    },

    "/admin/bookings/{id}/action": {
      post: adminOperation({
        write: true,
        summary: "Ghi nhận thanh toán hoặc hủy/hoàn tiền",
        parameters: [pathId],
        input: ref("AdminBookingActionInput"),
        output: dataResponse(ref("AdminBookingDetail")),
        description:
          "mark_paid: ghi nhận thanh toán cho đơn confirmed/unpaid. " +
          "cancel_unpaid: hủy đơn confirmed/unpaid. " +
          "refund_cancel: ghi nhận hoàn tiền và hủy đơn confirmed/paid. " +
          "confirmed phải là true. note dài 5–500 ký tự. " +
          "mark_paid và refund_cancel cần reference dài 4–120 ký tự. " +
          "Đây là ghi nhận đối soát thủ công, không tự chuyển tiền qua ngân hàng.",
        errorCodes: [400, 401, 403, 404, 409, 413, 500, 503],
      }),
    },

    // ==================================================
    // SUPPORT — 1 API
    // ==================================================

    "/support": {
      post: operation({
        tag: "Support",
        summary: "Gửi yêu cầu hỗ trợ",
        security: csrfSecurity,
        input: ref("SupportInput"),
        output: ref("SupportResponse"),
        status: 201,
        description:
          "Khách chưa đăng nhập được gửi hỗ trợ chung. " +
          "Nếu có booking_id, phải đăng nhập và đơn phải thuộc tài khoản hiện tại. " +
          "Lưu yêu cầu mới với status=pending. " +
          "Giới hạn 10 yêu cầu/15 phút/IP. API này lưu database, không tự gửi email.",
        errorCodes: [400, 401, 403, 413, 429, 500],
      }),
    },
  },
};

export default openapi;
