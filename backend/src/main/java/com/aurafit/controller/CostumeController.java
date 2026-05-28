package com.aurafit.controller;

import com.aurafit.service.CostumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/costumes")
@RequiredArgsConstructor
public class CostumeController {

    private final CostumeService costumeService;
}
