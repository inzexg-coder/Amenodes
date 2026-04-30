GROUP_NODE_BASE_SIZE EQU 48
GROUP_DATA_OFF       EQU 32    
GROUP_LEN_OFF        EQU 40   
GROUP_CAP_OFF        EQU 48     

GROUP_TYPE EQU 2

group_append:
    push rbp
    mov rbp, rsp
    push rbx
    ; RDI = node, XMM0 = value
    mov rbx, rdi                  
    mov rsi, [rbx + GROUP_LEN_OFF]
    mov rcx, [rbx + GROUP_CAP_OFF]  
    cmp rsi, rcx
    jne .has_space
    call group_grow
.has_space:
    mov rdi, [rbx + GROUP_DATA_OFF]
    mov rcx, [rbx + GROUP_LEN_OFF]   
    movsd qword [rdi + rcx*8], xmm0 
    inc qword [rbx + GROUP_LEN_OFF]  ; len++
    mov rdi, rbx
    TRIGGER_DEPENDENTS rdi
    pop rbx
    pop rbp
    ret

group_set_at:
    push rbp
    mov rbp, rsp
    ; проверка index < len
    mov rcx, [rdi + GROUP_LEN_OFF]
    cmp rsi, rcx
    jae .out_of_bounds
    mov rdx, [rdi + GROUP_DATA_OFF]
    movsd qword [rdx + rsi*8], xmm0
    TRIGGER_DEPENDENTS rdi
.out_of_bounds:
    pop rbp
    ret

group_pop:
    push rbp
    mov rbp, rsp
    mov rcx, [rdi + GROUP_LEN_OFF]
    test rcx, rcx
    jz .empty
    dec qword [rdi + GROUP_LEN_OFF]
    TRIGGER_DEPENDENTS rdi
.empty:
    pop rbp
    ret

group_get_at:
    mov rcx, [rdi + GROUP_LEN_OFF]
    cmp rsi, rcx
    jae .out
    mov rdx, [rdi + GROUP_DATA_OFF]
    movsd xmm0, qword [rdx + rsi*8]
    ret
.out:
    xorps xmm0, xmm0
    ret

group_read_output:
    mov rax, [rdi + GROUP_DATA_OFF]  
    mov rcx, [rdi + GROUP_LEN_OFF]   
    ret

group_grow:
    push rbp
    mov rbp, rsp
    push rbx
    push r12
    mov rbx, rdi            
    mov r12, [rbx + GROUP_CAP_OFF]
    mov rcx, [rbx + GROUP_LEN_OFF]
    mov rsi, r12
    cmp rsi, 0
    jne .double
    mov rsi, 4       
    jmp .alloc
.double:
    shl rsi, 1
.alloc:
    mov rdi, rsi
    shl rdi, 3      
    call malloc   ; => rax
    test rax, rax
    jz .fail
    mov rcx, [rbx + GROUP_LEN_OFF] 
    test rcx, rcx
    jz .copy_done
    mov rdi, rax                    
    mov rsi, [rbx + GROUP_DATA_OFF]  
    shl rcx, 3                  
    rep movsb
.copy_done:
    mov rdi, [rbx + GROUP_DATA_OFF]
    test rdi, rdi
    jz .free_done
    call free
.free_done:
    mov [rbx + GROUP_DATA_OFF], rax
    mov [rbx + GROUP_CAP_OFF], rsi
    jmp .done
.fail:
.done:
    pop r12
    pop rbx
    pop rbp
    ret

group_recompute:
    mov byte [rdi + DIRTY_FLAG_OFF], 0
    ret
