package com.aurafit.controller;

import com.aurafit.service.RentalOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class RentalOrderController {

    private final RentalOrderService rentalOrderService;
}
