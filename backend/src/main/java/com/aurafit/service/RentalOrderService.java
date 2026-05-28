package com.aurafit.service;

import com.aurafit.repository.RentalOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RentalOrderService {

    private final RentalOrderRepository rentalOrderRepository;
}
